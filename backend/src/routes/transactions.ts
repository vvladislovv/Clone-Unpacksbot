import { PrismaClient, TransactionStatus, TransactionType } from '@prisma/client';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const withdrawalSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['bank_card', 'yoomoney', 'qiwi']),
  details: z.object({
    cardNumber: z.string().optional(),
    accountId: z.string().optional(),
    phone: z.string().optional(),
  }),
});

interface TransactionRequest extends FastifyRequest {
  prisma: PrismaClient;
  user: { userId: string; role: string };
}

export async function transactionRoutes(fastify: FastifyInstance) {
  
  // Get user transactions
  fastify.get('/', {
    schema: {
      description: 'Get user transactions',
      tags: ['Transactions'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          type: { 
            type: 'string', 
            enum: ['DEPOSIT', 'WITHDRAWAL', 'COMMISSION', 'REFERRAL', 'CAMPAIGN_PAYMENT'] 
          },
          status: { 
            type: 'string', 
            enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] 
          },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          dateFrom: { type: 'string', format: 'date' },
          dateTo: { type: 'string', format: 'date' },
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: TransactionRequest, reply: FastifyReply) => {
    const {
      type,
      status,
      limit = 20,
      offset = 0,
      dateFrom,
      dateTo,
    } = request.query as any;

    try {
      const where = {
        userId: request.user.userId,
        ...(type && { type: type as TransactionType }),
        ...(status && { status: status as TransactionStatus }),
        ...(dateFrom && dateTo && {
          createdAt: {
            gte: new Date(dateFrom),
            lte: new Date(dateTo),
          },
        }),
      };

      const transactions = await request.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const totalCount = await request.prisma.transaction.count({ where });

      // Calculate totals by type
      const totals = await request.prisma.transaction.groupBy({
        by: ['type'],
        where: {
          userId: request.user.userId,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      });

      const totalsByType = totals.reduce((acc, item) => {
        acc[item.type] = item._sum.amount || 0;
        return acc;
      }, {} as Record<string, number>);

      reply.send({
        transactions,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
        totals: totalsByType,
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch transactions',
        message: 'An error occurred while fetching transactions',
      });
    }
  });

  // Request withdrawal
  fastify.post('/withdrawal', {
    schema: {
      description: 'Request money withdrawal',
      tags: ['Transactions'],
      security: [{ Bearer: [] }],
      body: withdrawalSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request: TransactionRequest, reply: FastifyReply) => {
    const data = withdrawalSchema.parse(request.body);

    try {
      // Get user balance and check minimum withdrawal
      const user = await request.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { balance: true },
      });

      if (!user) {
        return reply.code(404).send({
          error: 'User not found',
          message: 'User not found',
        });
      }

      // Get system settings
      const settings = await request.prisma.settings.findFirst();
      const minWithdrawal = settings?.minWithdrawalAmount || 100;
      const maxWithdrawal = settings?.maxWithdrawalAmount || 100000;

      if (data.amount < minWithdrawal) {
        return reply.code(400).send({
          error: 'Amount too small',
          message: `Minimum withdrawal amount is ${minWithdrawal}`,
        });
      }

      if (data.amount > maxWithdrawal) {
        return reply.code(400).send({
          error: 'Amount too large',
          message: `Maximum withdrawal amount is ${maxWithdrawal}`,
        });
      }

      if (user.balance < data.amount) {
        return reply.code(400).send({
          error: 'Insufficient balance',
          message: 'You do not have enough balance for this withdrawal',
        });
      }

      // Create withdrawal transaction
      const transaction = await request.prisma.$transaction(async (tx) => {
        // Deduct amount from user balance
        await tx.user.update({
          where: { id: request.user.userId },
          data: { balance: { decrement: data.amount } },
        });

        // Create transaction record
        return await tx.transaction.create({
          data: {
            userId: request.user.userId,
            type: 'WITHDRAWAL',
            amount: -data.amount, // Negative for withdrawal
            status: 'PENDING',
            description: `Withdrawal via ${data.method}`,
            metadata: {
              method: data.method,
              details: data.details,
            },
          },
        });
      });

      // Create notification
      await request.prisma.notification.create({
        data: {
          userId: request.user.userId,
          title: 'Withdrawal Request',
          message: `Your withdrawal request of ${data.amount} is being processed`,
          type: 'info',
          metadata: { transactionId: transaction.id },
        },
      });

      reply.code(201).send({
        transaction,
        message: 'Withdrawal request submitted successfully',
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to process withdrawal',
        message: 'An error occurred while processing withdrawal',
      });
    }
  });

  // Process referral commission (internal endpoint)
  fastify.post('/referral-commission', {
    schema: {
      description: 'Process referral commission',
      tags: ['Transactions'],
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          amount: { type: 'number' },
          description: { type: 'string' },
        },
        required: ['userId', 'amount', 'description'],
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: TransactionRequest, reply: FastifyReply) => {
    const { userId, amount, description } = request.body as {
      userId: string;
      amount: number;
      description: string;
    };

    // Only allow admin to call this endpoint
    if (request.user.role !== 'ADMIN') {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Only admins can process referral commissions',
      });
    }

    try {
      // Find user's referrer
      const user = await request.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          referredById: true,
          referredBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!user?.referredById) {
        return reply.send({
          success: false,
          message: 'User has no referrer',
        });
      }

      // Get referral commission rate
      const settings = await request.prisma.settings.findFirst();
      const commissionRate = settings?.referralCommission || 0.5; // 50%
      const commissionAmount = amount * commissionRate;

      // Create referral commission transaction
      const transaction = await request.prisma.$transaction(async (tx) => {
        // Add commission to referrer's balance
        await tx.user.update({
          where: { id: user.referredById! },
          data: { balance: { increment: commissionAmount } },
        });

        // Create transaction record
        return await tx.transaction.create({
          data: {
            userId: user.referredById!,
            type: 'REFERRAL',
            amount: commissionAmount,
            status: 'COMPLETED',
            description: `Referral commission: ${description}`,
            metadata: {
              referredUserId: userId,
              originalAmount: amount,
              commissionRate,
            },
          },
        });
      });

      // Create notification
      await request.prisma.notification.create({
        data: {
          userId: user.referredById!,
          title: 'Referral Commission',
          message: `You earned ${commissionAmount} from referral commission`,
          type: 'success',
          metadata: { transactionId: transaction.id },
        },
      });

      reply.send({
        success: true,
        transaction,
        message: 'Referral commission processed successfully',
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to process referral commission',
        message: 'An error occurred while processing referral commission',
      });
    }
  });

  // Get transaction statistics
  fastify.get('/stats', {
    schema: {
      description: 'Get transaction statistics',
      tags: ['Transactions'],
      security: [{ Bearer: [] }],
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['7d', '30d', '90d', '1y'], default: '30d' },
        },
      },
    },
    preHandler: [fastify.authenticate],
  }, async (request: TransactionRequest, reply: FastifyReply) => {
    const { period = '30d' } = request.query as any;

    try {
      // Calculate date range
      const now = new Date();
      const daysBack = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      }[period];

      const dateFrom = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Get completed transactions in period
      const transactions = await request.prisma.transaction.findMany({
        where: {
          userId: request.user.userId,
          status: 'COMPLETED',
          createdAt: { gte: dateFrom },
        },
        select: {
          type: true,
          amount: true,
          createdAt: true,
        },
      });

      // Calculate statistics
      const stats = {
        totalIncome: 0,
        totalExpenses: 0,
        referralEarnings: 0,
        campaignSpending: 0,
        withdrawals: 0,
        transactionCount: transactions.length,
      };

      transactions.forEach(tx => {
        if (tx.amount > 0) {
          stats.totalIncome += Number(tx.amount);
          if (tx.type === 'REFERRAL') {
            stats.referralEarnings += Number(tx.amount);
          }
        } else {
          stats.totalExpenses += Math.abs(Number(tx.amount));
          if (tx.type === 'WITHDRAWAL') {
            stats.withdrawals += Math.abs(Number(tx.amount));
          } else if (tx.type === 'CAMPAIGN_PAYMENT') {
            stats.campaignSpending += Math.abs(Number(tx.amount));
          }
        }
      });

      // Group by date for chart data
      const dailyStats = transactions.reduce((acc, tx) => {
        const date = tx.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { income: 0, expenses: 0 };
        }
        
        if (tx.amount > 0) {
          acc[date].income += Number(tx.amount);
        } else {
          acc[date].expenses += Math.abs(Number(tx.amount));
        }
        
        return acc;
      }, {} as Record<string, { income: number; expenses: number }>);

      reply.send({
        stats,
        chartData: Object.entries(dailyStats).map(([date, data]) => ({
          date,
          ...data,
        })),
        period,
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to fetch statistics',
        message: 'An error occurred while fetching transaction statistics',
      });
    }
  });

  // Cancel pending transaction
  fastify.post('/:id/cancel', {
    schema: {
      description: 'Cancel pending transaction',
      tags: ['Transactions'],
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
  }, async (request: TransactionRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const transaction = await request.prisma.transaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        return reply.code(404).send({
          error: 'Transaction not found',
          message: 'Transaction with this ID does not exist',
        });
      }

      if (transaction.userId !== request.user.userId && request.user.role !== 'ADMIN') {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'You can only cancel your own transactions',
        });
      }

      if (transaction.status !== 'PENDING') {
        return reply.code(400).send({
          error: 'Cannot cancel transaction',
          message: 'Only pending transactions can be cancelled',
        });
      }

      // Cancel transaction and refund if needed
      await request.prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });

        // Refund withdrawal amount
        if (transaction.type === 'WITHDRAWAL' && transaction.amount < 0) {
          await tx.user.update({
            where: { id: transaction.userId },
            data: { balance: { increment: Math.abs(Number(transaction.amount)) } },
          });
        }
      });

      reply.send({
        success: true,
        message: 'Transaction cancelled successfully',
      });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({
        error: 'Failed to cancel transaction',
        message: 'An error occurred while cancelling transaction',
      });
    }
  });
}
