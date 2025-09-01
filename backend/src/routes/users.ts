import { PrismaClient } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

interface UserRequest extends FastifyRequest {
  prisma: PrismaClient;
  user: { userId: string; role: string };
}

export async function userRoutes(fastify: FastifyInstance) {
  
  // Update user profile
  fastify.put('/profile', {
    schema: {
      description: 'Update user profile',
      tags: ['Users'],
      security: [{ Bearer: [] }],
      body: updateProfileSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: UserRequest, reply: FastifyReply) => {
    const data = updateProfileSchema.parse(request.body);

    try {
      const user = await request.prisma.user.update({
        where: { id: request.user.userId },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          balance: true,
          isVerified: true,
          createdAt: true,
        },
      });

      reply.send(user);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Update failed',
        message: 'Failed to update profile',
      });
    }
  });

  // Get user referrals
  fastify.get('/referrals', {
    schema: {
      description: 'Get user referrals',
      tags: ['Users'],
      security: [{ Bearer: [] }],
    },
    preHandler: [fastify.authenticate],
  }, async (request: UserRequest, reply: FastifyReply) => {
    try {
      const referrals = await request.prisma.user.findMany({
        where: { referredById: request.user.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate total referral earnings
      const totalEarnings = await request.prisma.transaction.aggregate({
        where: {
          userId: request.user.userId,
          type: 'REFERRAL',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      });

      reply.send({
        referrals,
        totalEarnings: totalEarnings._sum.amount || 0,
        count: referrals.length,
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch referrals',
        message: 'An error occurred while fetching referrals',
      });
    }
  });

  // Get user balance and transactions
  fastify.get('/balance', {
    schema: {
      description: 'Get user balance and recent transactions',
      tags: ['Users'],
      security: [{ Bearer: [] }],
    },
    preHandler: [fastify.authenticate],
  }, async (request: UserRequest, reply: FastifyReply) => {
    try {
      const user = await request.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { balance: true },
      });

      const recentTransactions = await request.prisma.transaction.findMany({
        where: { userId: request.user.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          description: true,
          createdAt: true,
        },
      });

      reply.send({
        balance: user?.balance || 0,
        transactions: recentTransactions,
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch balance',
        message: 'An error occurred while fetching balance',
      });
    }
  });

  // Get user notifications
  fastify.get('/notifications', {
    schema: {
      description: 'Get user notifications',
      tags: ['Users'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          unread: { type: 'boolean' },
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: UserRequest, reply: FastifyReply) => {
    const { limit = 20, offset = 0, unread } = request.query as any;

    try {
      const where = {
        userId: request.user.userId,
        ...(unread !== undefined && { isRead: !unread }),
      };

      const notifications = await request.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const totalCount = await request.prisma.notification.count({ where });
      const unreadCount = await request.prisma.notification.count({
        where: { userId: request.user.userId, isRead: false },
      });

      reply.send({
        notifications,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
        unreadCount,
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch notifications',
        message: 'An error occurred while fetching notifications',
      });
    }
  });

  // Mark notification as read
  fastify.put('/notifications/:id/read', {
    schema: {
      description: 'Mark notification as read',
      tags: ['Users'],
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: UserRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      await request.prisma.notification.updateMany({
        where: {
          id,
          userId: request.user.userId,
        },
        data: { isRead: true },
      });

      reply.send({ success: true });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to mark notification as read',
        message: 'An error occurred while updating notification',
      });
    }
  });

  // Mark all notifications as read
  fastify.put('/notifications/read-all', {
    schema: {
      description: 'Mark all notifications as read',
      tags: ['Users'],
      security: [{ Bearer: [] }],
    },
    preHandler: [fastify.authenticate],
  }, async (request: UserRequest, reply: FastifyReply) => {
    try {
      await request.prisma.notification.updateMany({
        where: {
          userId: request.user.userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      reply.send({ success: true });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to mark notifications as read',
        message: 'An error occurred while updating notifications',
      });
    }
  });
}
