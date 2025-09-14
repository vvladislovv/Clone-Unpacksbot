import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getFirstUser() {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('No users found in database');
    }
    return user;
  }

  async getAdminChat(userId: string) {
    // Находим или создаем чат с админом для пользователя
    let adminChat = await this.prisma.chat.findFirst({
      where: {
        name: 'Чат с поддержкой',
        isGroup: false,
        participants: {
          some: { userId: userId }
        }
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Если чата нет, создаем его
    if (!adminChat) {
      adminChat = await this.prisma.chat.create({
        data: {
          name: 'Чат с поддержкой',
          isGroup: false,
          participants: {
            create: [
              {
                userId: userId,
                isAdmin: false,
              }
            ],
          },
        },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          }
        }
      });
    }

    return adminChat;
  }

  async sendMessageToAdmin(userId: string, content: string) {
    // Получаем чат с админом
    const adminChat = await this.getAdminChat(userId);
    
    // Создаем сообщение от пользователя
    const message = await this.prisma.message.create({
      data: {
        chatId: adminChat.id,
        senderId: userId,
        content: content,
        type: 'TEXT'
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Симулируем ответ админа через 2-3 секунды
    setTimeout(async () => {
      const adminResponses = [
        'Спасибо за ваше сообщение! Мы получили ваш запрос и ответим в ближайшее время.',
        'Понял вашу проблему. Наш специалист рассмотрит ваш вопрос и даст подробный ответ.',
        'Спасибо за обращение! Мы работаем над решением вашего вопроса.',
        'Ваш запрос принят в обработку. Обычно время ответа составляет 1-2 часа в рабочее время.',
        'Понял! Мы уже работаем над вашим вопросом. Скоро дадим ответ.'
      ];
      
      const randomResponse = adminResponses[Math.floor(Math.random() * adminResponses.length)];
      
      // Создаем ответ от админа (используем того же пользователя, но помечаем как админа)
      await this.prisma.message.create({
        data: {
          chatId: adminChat.id,
          senderId: userId, // В реальной системе здесь был бы ID админа
          content: randomResponse,
          type: 'TEXT',
          metadata: { isFromAdmin: true }
        }
      });
    }, 2000 + Math.random() * 1000);

    return message;
  }

  // Новые методы для чатов
  async getUserChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
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
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chats;
  }

  async createChat(userId: string, createChatDto: any) {
    const chat = await this.prisma.chat.create({
      data: {
        name: createChatDto.name,
        isGroup: createChatDto.isGroup || false,
        participants: {
          create: [
            {
              userId: userId,
              isAdmin: true,
            },
            ...(createChatDto.participantIds || []).map((id: string) => ({
              userId: id,
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
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return chat;
  }

  async getChatMessages(userId: string, chatId: string) {
    // Проверяем, что пользователь является участником чата
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: userId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        chatId: chatId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages;
  }

  async sendMessage(userId: string, chatId: string, messageDto: any) {
    // Проверяем, что пользователь является участником чата
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: userId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    const message = await this.prisma.message.create({
      data: {
        chatId: chatId,
        senderId: userId,
        type: messageDto.type || 'TEXT',
        content: messageDto.content,
        metadata: messageDto.metadata,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Обновляем время последнего обновления чата
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async editMessage(userId: string, messageId: string, updateMessageDto: any) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: updateMessageDto.content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });
  }

  // Legacy methods for backward compatibility
  async findAll() {
    return this.prisma.message.findMany();
  }

  async findOne(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
    });
  }

  async create(createMessageDto: any) {
    return this.prisma.message.create({
      data: createMessageDto,
    });
  }

  async update(id: string, updateMessageDto: any) {
    return this.prisma.message.update({
      where: { id },
      data: updateMessageDto,
    });
  }

  async remove(id: string) {
    return this.prisma.message.delete({
      where: { id },
    });
  }
}
