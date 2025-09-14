import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.transaction.findMany();
  }

  async findOne(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requestWithdrawal(userId: string, withdrawalDto: any) {
    // Проверяем баланс пользователя
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.balance.toNumber() < withdrawalDto.amount) {
      throw new ForbiddenException('Insufficient balance');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId: userId,
        type: 'WITHDRAWAL',
        amount: withdrawalDto.amount,
        status: 'PENDING',
        description: `Withdrawal request to ${withdrawalDto.paymentMethod}`,
        metadata: {
          paymentMethod: withdrawalDto.paymentMethod,
          accountDetails: withdrawalDto.accountDetails,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return transaction;
  }

  async getUserStats(userId: string) {
    const [
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      totalAmount,
      totalWithdrawals,
      totalDeposits,
    ] = await Promise.all([
      this.prisma.transaction.count({
        where: { userId },
      }),
      this.prisma.transaction.count({
        where: { userId, status: 'COMPLETED' },
      }),
      this.prisma.transaction.count({
        where: { userId, status: 'PENDING' },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: 'WITHDRAWAL', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: 'DEPOSIT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      totalAmount: totalAmount._sum.amount || 0,
      totalWithdrawals: totalWithdrawals._sum.amount || 0,
      totalDeposits: totalDeposits._sum.amount || 0,
    };
  }

  async cancelTransaction(userId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: userId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      throw new ForbiddenException('Only pending transactions can be cancelled');
    }

    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'CANCELLED' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async create(createTransactionDto: any) {
    return this.prisma.transaction.create({
      data: createTransactionDto,
    });
  }

  async update(id: string, updateTransactionDto: any) {
    return this.prisma.transaction.update({
      where: { id },
      data: updateTransactionDto,
    });
  }

  async remove(id: string) {
    return this.prisma.transaction.delete({
      where: { id },
    });
  }

  async getTransactions(userId: string, query: any) {
    this.logger.log(`📊 Getting transactions for user ${userId} with filters: ${JSON.stringify(query)}`);
    
    const where: any = { userId };
    
    if (query.type) {
      where.type = query.type;
    }
    
    if (query.status) {
      where.status = query.status;
    }
    
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      take: query.limit || 50,
      skip: query.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return transactions;
  }

  async getStats(userId: string, query: any) {
    this.logger.log(`📈 Getting transaction stats for user ${userId}`);
    
    const period = query.period || '30d';
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      totalAmount,
      totalWithdrawals,
      totalDeposits,
    ] = await Promise.all([
      this.prisma.transaction.count({
        where: { 
          userId,
          createdAt: { gte: startDate }
        },
      }),
      this.prisma.transaction.count({
        where: { 
          userId, 
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
      }),
      this.prisma.transaction.count({
        where: { 
          userId, 
          status: 'PENDING',
          createdAt: { gte: startDate }
        },
      }),
      this.prisma.transaction.aggregate({
        where: { 
          userId, 
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { 
          userId, 
          type: 'WITHDRAWAL', 
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { 
          userId, 
          type: 'DEPOSIT', 
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      period,
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      totalAmount: totalAmount._sum.amount || 0,
      totalWithdrawals: totalWithdrawals._sum.amount || 0,
      totalDeposits: totalDeposits._sum.amount || 0,
    };
  }

  async getCompleteTransactionData(userId: string) {
    // Получаем информацию о пользователе
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        balance: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Получаем все транзакции пользователя
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        commission: true,
        status: true,
        description: true,
        externalId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Получаем все платежи пользователя
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        method: true,
        description: true,
        externalId: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Вычисляем статистику по транзакциям
    const transactionStats = await this.prisma.transaction.groupBy({
      by: ['type', 'status'],
      where: { userId },
      _count: { id: true },
      _sum: { amount: true }
    });

    // Вычисляем статистику по платежам
    const paymentStats = await this.prisma.payment.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
      _sum: { amount: true }
    });

    // Создаем объединенную статистику
    const statistics = {
      totalTransactions: transactions.length,
      totalPayments: payments.length,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalCommissions: 0,
      totalReferrals: 0,
      totalCampaignPayments: 0,
      pendingTransactions: 0,
      completedTransactions: 0,
      failedTransactions: 0,
      cancelledTransactions: 0,
      pendingPayments: 0,
      completedPayments: 0,
      cancelledPayments: 0
    };

    // Статистика по типам транзакций
    transactionStats.forEach(stat => {
      const amount = Number(stat._sum.amount || 0);
      const count = stat._count.id;

      switch (stat.type) {
        case 'DEPOSIT':
          statistics.totalDeposits += amount;
          break;
        case 'WITHDRAWAL':
          statistics.totalWithdrawals += amount;
          break;
        case 'COMMISSION':
          statistics.totalCommissions += amount;
          break;
        case 'REFERRAL':
          statistics.totalReferrals += amount;
          break;
        case 'CAMPAIGN_PAYMENT':
          statistics.totalCampaignPayments += amount;
          break;
      }

      // Статистика по статусам транзакций
      switch (stat.status) {
        case 'PENDING':
          statistics.pendingTransactions += count;
          break;
        case 'COMPLETED':
          statistics.completedTransactions += count;
          break;
        case 'FAILED':
          statistics.failedTransactions += count;
          break;
        case 'CANCELLED':
          statistics.cancelledTransactions += count;
          break;
      }
    });

    // Статистика по статусам платежей
    paymentStats.forEach(stat => {
      const count = stat._count.id;

      switch (stat.status) {
        case 'PENDING':
          statistics.pendingPayments += count;
          break;
        case 'COMPLETED':
          statistics.completedPayments += count;
          break;
        case 'CANCELLED':
          statistics.cancelledPayments += count;
          break;
      }
    });

    // Создаем объединенную активность (транзакции + платежи)
    const allActivity = [];

    // Добавляем транзакции
    transactions.forEach(transaction => {
      allActivity.push({
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
        source: 'transaction',
        commission: transaction.commission ? Number(transaction.commission) : 0,
        externalId: transaction.externalId,
        metadata: transaction.metadata
      });
    });

    // Добавляем платежи
    payments.forEach(payment => {
      allActivity.push({
        id: payment.id,
        type: 'PAYMENT',
        amount: Number(payment.amount),
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt,
        source: 'payment',
        paymentMethod: payment.method,
        externalId: payment.externalId,
        metadata: payment.metadata
      });
    });

    // Сортируем по дате создания (новые сверху)
    allActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: Number(user.balance),
        role: user.role,
        memberSince: user.createdAt
      },
      balance: Number(user.balance),
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        commission: t.commission ? Number(t.commission) : 0,
        status: t.status,
        description: t.description,
        externalId: t.externalId,
        metadata: t.metadata,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      })),
      payments: payments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        paymentMethod: p.method,
        description: p.description,
        externalId: p.externalId,
        metadata: p.metadata,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      statistics,
      allActivity: allActivity.slice(0, 50) // Последние 50 активностей
    };
  }

  // ========== МЕТОДЫ ДЛЯ ПЛАТЕЖЕЙ ==========

  async createPayment(userId: string, createPaymentDto: any) {
    this.logger.log(`💰 Creating payment for user ${userId}: ${createPaymentDto.amount} ${createPaymentDto.paymentMethod}`);
    
    const payment = await this.prisma.payment.create({
      data: {
        userId: userId,
        amount: createPaymentDto.amount || 0,
        method: createPaymentDto.paymentMethod || 'CARD',
        description: createPaymentDto.description,
        externalId: createPaymentDto.externalId,
        metadata: createPaymentDto.metadata,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`✅ Payment created successfully: ${payment.id} with status ${payment.status}`);
    return payment;
  }

  async getPayment(userId: string, id: string) {
    this.logger.log(`🔍 Getting payment ${id} for user ${userId}`);
    
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: id,
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`❌ Payment ${id} not found for user ${userId}`);
      throw new NotFoundException('Payment not found');
    }

    this.logger.log(`✅ Payment ${id} found with status ${payment.status}`);
    return payment;
  }

  async confirmPayment(userId: string, id: string) {
    this.logger.log(`✅ Confirming payment ${id} for user ${userId}`);
    
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!payment) {
      this.logger.warn(`❌ Payment ${id} not found for user ${userId}`);
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'PENDING') {
      this.logger.warn(`❌ Payment ${id} cannot be confirmed, current status: ${payment.status}`);
      throw new ForbiddenException('Payment cannot be confirmed');
    }

    this.logger.log(`💰 Updating payment ${id} status to COMPLETED and adding ${payment.amount} to user balance`);

    // Обновляем статус платежа и баланс пользователя
    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Обновляем баланс пользователя
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        balance: {
          increment: payment.amount,
        },
      },
    });

    this.logger.log(`✅ Payment ${id} confirmed successfully, user balance updated`);
    return updatedPayment;
  }

  async cancelPayment(userId: string, id: string) {
    this.logger.log(`❌ Cancelling payment ${id} for user ${userId}`);
    
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: id,
        userId: userId,
      },
    });

    if (!payment) {
      this.logger.warn(`❌ Payment ${id} not found for user ${userId}`);
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'PENDING') {
      this.logger.warn(`❌ Payment ${id} cannot be cancelled, current status: ${payment.status}`);
      throw new ForbiddenException('Payment cannot be cancelled');
    }

    this.logger.log(`🔄 Updating payment ${id} status to CANCELLED`);

    const cancelledPayment = await this.prisma.payment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`✅ Payment ${id} cancelled successfully`);
    return cancelledPayment;
  }
}
