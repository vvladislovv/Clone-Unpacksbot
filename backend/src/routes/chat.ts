import { MessageType, PrismaClient } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const createChatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isGroup: z.boolean().default(false),
  participantIds: z.array(z.string()).min(1),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']).default('TEXT'),
  metadata: z.record(z.any()).optional(),
});

interface ChatRequest extends FastifyRequest {
  prisma: PrismaClient;
  user: { userId: string; role: string };
}

export async function chatRoutes(fastify: FastifyInstance) {
  
  // WebSocket connection for real-time chat
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
      // Handle WebSocket connection
      connection.socket.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle different message types
          switch (data.type) {
            case 'join_chat':
              connection.socket.join(`chat_${data.chatId}`);
              break;
              
            case 'leave_chat':
              connection.socket.leave(`chat_${data.chatId}`);
              break;
              
            case 'send_message':
              // Validate user permissions and send message
              // This would typically involve database operations
              break;
              
            case 'typing':
              connection.socket.to(`chat_${data.chatId}`).emit('user_typing', {
                userId: data.userId,
                isTyping: data.isTyping,
              });
              break;
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
      
      connection.socket.on('close', () => {
        // Handle connection close
      });
    });
  });

  // Get user's chats
  fastify.get('/chats', {
    schema: {
      description: 'Get user chats',
      tags: ['Chat'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: ChatRequest, reply: FastifyReply) => {
    const { limit = 20, offset = 0 } = request.query as any;

    try {
      const chats = await request.prisma.chat.findMany({
        where: {
          participants: {
            some: {
              userId: request.user.userId,
              leftAt: null,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          participants: {
            where: { leftAt: null },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              type: true,
              content: true,
              createdAt: true,
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      });

      reply.send({ chats });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch chats',
        message: 'An error occurred while fetching chats',
      });
    }
  });

  // Create new chat
  fastify.post('/chats', {
    schema: {
      description: 'Create new chat',
      tags: ['Chat'],
      security: [{ Bearer: [] }],
      body: createChatSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: ChatRequest, reply: FastifyReply) => {
    const data = createChatSchema.parse(request.body);

    try {
      // Check if it's a direct chat (2 participants) and already exists
      if (!data.isGroup && data.participantIds.length === 1) {
        const otherUserId = data.participantIds[0];
        const existingChat = await request.prisma.chat.findFirst({
          where: {
            isGroup: false,
            participants: {
              every: {
                userId: { in: [request.user.userId, otherUserId] },
                leftAt: null,
              },
            },
          },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        });

        if (existingChat && existingChat.participants.length === 2) {
          return reply.send(existingChat);
        }
      }

      // Create new chat
      const chat = await request.prisma.chat.create({
        data: {
          name: data.name,
          isGroup: data.isGroup,
          participants: {
            create: [
              {
                userId: request.user.userId,
                isAdmin: true,
              },
              ...data.participantIds.map(userId => ({
                userId,
                isAdmin: false,
              })),
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      // Send system message
      await request.prisma.message.create({
        data: {
          chatId: chat.id,
          senderId: request.user.userId,
          type: 'SYSTEM',
          content: `Chat created`,
        },
      });

      reply.code(201).send(chat);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to create chat',
        message: 'An error occurred while creating chat',
      });
    }
  });

  // Get chat messages
  fastify.get('/chats/:chatId/messages', {
    schema: {
      description: 'Get chat messages',
      tags: ['Chat'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          chatId: { type: 'string' },
        },
        required: ['chatId'],
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          cursor: { type: 'string' }, // For pagination
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: ChatRequest, reply: FastifyReply) => {
    const { chatId } = request.params as { chatId: string };
    const { limit = 50, cursor } = request.query as any;

    try {
      // Check if user is participant
      const participant = await request.prisma.chatParticipant.findFirst({
        where: {
          chatId,
          userId: request.user.userId,
          leftAt: null,
        },
      });

      if (!participant) {
        return reply.code(403).send({
          error: 'Access denied',
          message: 'You are not a participant of this chat',
        });
      }

      const messages = await request.prisma.message.findMany({
        where: {
          chatId,
          isDeleted: false,
          ...(cursor && {
            createdAt: { lt: new Date(cursor) },
          }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      // Reverse to show newest last
      messages.reverse();

      reply.send({
        messages,
        hasMore: messages.length === limit,
        nextCursor: messages.length > 0 ? messages[0]?.createdAt : null,
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch messages',
        message: 'An error occurred while fetching messages',
      });
    }
  });

  // Send message
  fastify.post('/chats/:chatId/messages', {
    schema: {
      description: 'Send message to chat',
      tags: ['Chat'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          chatId: { type: 'string' },
        },
        required: ['chatId'],
      },
      body: sendMessageSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: ChatRequest, reply: FastifyReply) => {
    const { chatId } = request.params as { chatId: string };
    const data = sendMessageSchema.parse(request.body);

    try {
      // Check if user is participant
      const participant = await request.prisma.chatParticipant.findFirst({
        where: {
          chatId,
          userId: request.user.userId,
          leftAt: null,
        },
      });

      if (!participant) {
        return reply.code(403).send({
          error: 'Access denied',
          message: 'You are not a participant of this chat',
        });
      }

      const message = await request.prisma.message.create({
        data: {
          chatId,
          senderId: request.user.userId,
          type: data.type as MessageType,
          content: data.content,
          metadata: data.metadata,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      // Update chat's updated timestamp
      await request.prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      });

      // TODO: Emit WebSocket event to chat participants
      // fastify.websocketServer.to(`chat_${chatId}`).emit('new_message', message);

      reply.code(201).send(message);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to send message',
        message: 'An error occurred while sending message',
      });
    }
  });

  // Edit message
  fastify.put('/messages/:messageId', {
    schema: {
      description: 'Edit message',
      tags: ['Chat'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
        },
        required: ['messageId'],
      },
      body: {
        type: 'object',
        properties: {
          content: { type: 'string', minLength: 1 },
        },
        required: ['content'],
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: ChatRequest, reply: FastifyReply) => {
    const { messageId } = request.params as { messageId: string };
    const { content } = request.body as { content: string };

    try {
      const message = await request.prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        return reply.code(404).send({
          error: 'Message not found',
          message: 'Message with this ID does not exist',
        });
      }

      if (message.senderId !== request.user.userId) {
        return reply.code(403).send({
          error: 'Access denied',
          message: 'You can only edit your own messages',
        });
      }

      // Check if message is older than 24 hours
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (message.createdAt < dayAgo) {
        return reply.code(400).send({
          error: 'Edit time expired',
          message: 'Messages can only be edited within 24 hours',
        });
      }

      const updatedMessage = await request.prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          isEdited: true,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatar: true,
            },
          },
        },
      });

      reply.send(updatedMessage);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to edit message',
        message: 'An error occurred while editing message',
      });
    }
  });

  // Delete message
  fastify.delete('/messages/:messageId', {
    schema: {
      description: 'Delete message',
      tags: ['Chat'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
        },
        required: ['messageId'],
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: ChatRequest, reply: FastifyReply) => {
    const { messageId } = request.params as { messageId: string };

    try {
      const message = await request.prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        return reply.code(404).send({
          error: 'Message not found',
          message: 'Message with this ID does not exist',
        });
      }

      if (message.senderId !== request.user.userId && request.user.role !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Access denied',
          message: 'You can only delete your own messages',
        });
      }

      await request.prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true },
      });

      reply.send({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to delete message',
        message: 'An error occurred while deleting message',
      });
    }
  });

  // Add participant to group chat
  fastify.post('/chats/:chatId/participants', {
    schema: {
      description: 'Add participant to group chat',
      tags: ['Chat'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          chatId: { type: 'string' },
        },
        required: ['chatId'],
      },
      body: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
        },
        required: ['userId'],
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: ChatRequest, reply: FastifyReply) => {
    const { chatId } = request.params as { chatId: string };
    const { userId } = request.body as { userId: string };

    try {
      // Check if user is admin of the group
      const adminParticipant = await request.prisma.chatParticipant.findFirst({
        where: {
          chatId,
          userId: request.user.userId,
          isAdmin: true,
          leftAt: null,
        },
      });

      if (!adminParticipant) {
        return reply.code(403).send({
          error: 'Access denied',
          message: 'Only group admins can add participants',
        });
      }

      // Check if user is already a participant
      const existingParticipant = await request.prisma.chatParticipant.findFirst({
        where: {
          chatId,
          userId,
          leftAt: null,
        },
      });

      if (existingParticipant) {
        return reply.code(400).send({
          error: 'User already in chat',
          message: 'User is already a participant of this chat',
        });
      }

      // Add participant
      await request.prisma.chatParticipant.create({
        data: {
          chatId,
          userId,
          isAdmin: false,
        },
      });

      // Send system message
      await request.prisma.message.create({
        data: {
          chatId,
          senderId: request.user.userId,
          type: 'SYSTEM',
          content: `User added to the group`,
        },
      });

      reply.send({ success: true, message: 'Participant added successfully' });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to add participant',
        message: 'An error occurred while adding participant',
      });
    }
  });

  // Leave chat
  fastify.post('/chats/:chatId/leave', {
    schema: {
      description: 'Leave chat',
      tags: ['Chat'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          chatId: { type: 'string' },
        },
        required: ['chatId'],
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: ChatRequest, reply: FastifyReply) => {
    const { chatId } = request.params as { chatId: string };

    try {
      const participant = await request.prisma.chatParticipant.findFirst({
        where: {
          chatId,
          userId: request.user.userId,
          leftAt: null,
        },
      });

      if (!participant) {
        return reply.code(404).send({
          error: 'Not a participant',
          message: 'You are not a participant of this chat',
        });
      }

      // Mark as left
      await request.prisma.chatParticipant.update({
        where: { id: participant.id },
        data: { leftAt: new Date() },
      });

      // Send system message
      await request.prisma.message.create({
        data: {
          chatId,
          senderId: request.user.userId,
          type: 'SYSTEM',
          content: `User left the chat`,
        },
      });

      reply.send({ success: true, message: 'Left chat successfully' });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to leave chat',
        message: 'An error occurred while leaving chat',
      });
    }
  });
}
