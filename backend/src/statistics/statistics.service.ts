import { Injectable, NotFoundException } from '@nestjs/common';
import { DealStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  private getDateFilter(period?: string) {
    if (!period) return {};
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return {};
    }
    
    return {
      createdAt: {
        gte: startDate,
      },
    };
  }

  async getUserStats(userId: string, period?: string) {
    const dateFilter = this.getDateFilter(period);
    
    const [
      totalProducts,
      activeProducts,
      totalDeals,
      completedDeals,
      totalRevenue,
      totalSpent,
      totalReferrals,
      referralEarnings,
      // Дополнительные метрики
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      totalIncome,
      totalExpenses,
    ] = await Promise.all([
      this.prisma.product.count({
        where: { sellerId: userId },
      }),
      this.prisma.product.count({
        where: { sellerId: userId, isActive: true },
      }),
      this.prisma.deal.count({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId },
          ],
          ...dateFilter,
        },
      }),
      this.prisma.deal.count({
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId },
          ],
          status: DealStatus.COMPLETED,
          ...dateFilter,
        },
      }),
      // Доходы: DEPOSIT + COMMISSION + REFERRAL + CAMPAIGN_PAYMENT
      this.prisma.transaction.aggregate({
        where: {
          userId: userId,
          type: {
            in: ['DEPOSIT', 'COMMISSION', 'REFERRAL', 'CAMPAIGN_PAYMENT']
          },
          status: 'COMPLETED',
          ...dateFilter,
        },
        _sum: { amount: true },
      }),
      // Расходы: WITHDRAWAL + PAYMENT
      this.prisma.transaction.aggregate({
        where: {
          userId: userId,
          type: {
            in: ['WITHDRAWAL', 'PAYMENT']
          },
          status: 'COMPLETED',
          ...dateFilter,
        },
        _sum: { amount: true },
      }),
      this.prisma.user.count({
        where: { referredById: userId },
      }),
      // Заработок с рефералов
      this.prisma.transaction.aggregate({
        where: {
          userId: userId,
          type: 'REFERRAL',
          status: 'COMPLETED',
          ...dateFilter,
        },
        _sum: { amount: true },
      }),
      // Общее количество транзакций
      this.prisma.transaction.count({
        where: { 
          userId: userId,
          ...dateFilter,
        },
      }),
      // Завершенные транзакции
      this.prisma.transaction.count({
        where: { 
          userId: userId,
          status: 'COMPLETED',
          ...dateFilter,
        },
      }),
      // Ожидающие транзакции
      this.prisma.transaction.count({
        where: { 
          userId: userId,
          status: 'PENDING',
          ...dateFilter,
        },
      }),
      // Общий доход (все положительные транзакции)
      this.prisma.transaction.aggregate({
        where: {
          userId: userId,
          type: {
            in: ['DEPOSIT', 'COMMISSION', 'REFERRAL', 'CAMPAIGN_PAYMENT']
          },
          status: 'COMPLETED',
          ...dateFilter,
        },
        _sum: { amount: true },
      }),
      // Общие расходы (все отрицательные транзакции)
      this.prisma.transaction.aggregate({
        where: {
          userId: userId,
          type: {
            in: ['WITHDRAWAL', 'PAYMENT']
          },
          status: 'COMPLETED',
          ...dateFilter,
        },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenueAmount = totalRevenue._sum.amount || 0;
    const totalSpentAmount = totalSpent._sum.amount || 0;
    const referralEarningsAmount = referralEarnings._sum.amount || 0;
    const totalIncomeAmount = totalIncome._sum.amount || 0;
    const totalExpensesAmount = totalExpenses._sum.amount || 0;

    return {
      // Основные метрики
      totalProducts,
      activeProducts,
      totalDeals,
      completedDeals,
      totalRevenue: totalRevenueAmount,
      totalSpent: totalSpentAmount,
      totalReferrals,
      referralEarnings: referralEarningsAmount,
      
      // Дополнительные метрики
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      totalIncome: totalIncomeAmount,
      totalExpenses: totalExpensesAmount,
      
      // Вычисляемые метрики
      netIncome: Number(totalIncomeAmount) - Number(totalExpensesAmount),
      completionRate: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0,
      averageTransactionAmount: completedTransactions > 0 ? Number(totalIncomeAmount) / completedTransactions : 0,
    };
  }

  async getProductStats(userId: string, productId: string) {
    // Проверяем, что пользователь является владельцем товара
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: userId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or you are not the owner');
    }

    const [
      totalDeals,
      completedDeals,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.deal.count({
        where: { productId: productId },
      }),
      this.prisma.deal.count({
        where: {
          productId: productId,
          status: DealStatus.COMPLETED,
        },
      }),
      this.prisma.deal.aggregate({
        where: {
          productId: productId,
          status: DealStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      productId,
      productTitle: product.title,
      totalDeals,
      completedDeals,
      totalRevenue: totalRevenue._sum.amount || 0,
      averageRating: product.rating || 0,
      reviewsCount: product.reviewsCount || 0,
    };
  }

  async getSalesStats(userId: string) {
    const [
      totalSales,
      completedSales,
      pendingSales,
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
    ] = await Promise.all([
      this.prisma.deal.count({
        where: { sellerId: userId },
      }),
      this.prisma.deal.count({
        where: {
          sellerId: userId,
          status: DealStatus.COMPLETED,
        },
      }),
      this.prisma.deal.count({
        where: {
          sellerId: userId,
          status: 'PENDING',
        },
      }),
      this.prisma.deal.aggregate({
        where: {
          sellerId: userId,
          status: DealStatus.COMPLETED,
        },
        _sum: { amount: true },
      }),
      this.prisma.deal.aggregate({
        where: {
          sellerId: userId,
          status: DealStatus.COMPLETED,
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.deal.aggregate({
        where: {
          sellerId: userId,
          status: DealStatus.COMPLETED,
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalSales,
      completedSales,
      pendingSales,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      weeklyRevenue: weeklyRevenue._sum.amount || 0,
    };
  }
}

