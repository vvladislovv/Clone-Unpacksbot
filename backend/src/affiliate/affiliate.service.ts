import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AffiliateService {
  constructor(private prisma: PrismaService) {}

  async getFirstUser() {
    const user = await this.prisma.user.findFirst();
    if (!user) {
      throw new Error('No users found in database');
    }
    return user;
  }

  async getStats(userId: string) {
    const [
      totalReferrals,
      activeReferrals,
      totalCommissions,
      pendingCommissions,
      totalPayouts,
      pendingPayouts,
      user,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { referredById: userId },
      }),
      this.prisma.user.count({
        where: {
          referredById: userId,
          isActive: true,
        },
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId: userId,
          type: 'REFERRAL',
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId: userId,
          type: 'REFERRAL',
          status: 'PENDING',
        },
        _sum: { amount: true },
      }),
      this.prisma.payout.aggregate({
        where: {
          userId: userId,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
      }),
      this.prisma.payout.aggregate({
        where: {
          userId: userId,
          status: 'PENDING',
        },
        _sum: { amount: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      }),
    ]);

    // Получаем комиссию за текущий месяц
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const thisMonthCommissions = await this.prisma.transaction.aggregate({
      where: {
        userId: userId,
        type: 'REFERRAL',
        status: 'COMPLETED',
        createdAt: {
          gte: currentMonth,
        },
      },
      _sum: { amount: true },
    });

    return {
      totalReferrals,
      activeReferrals,
      totalCommission: Number(totalCommissions._sum.amount || 0),
      thisMonthCommission: Number(thisMonthCommissions._sum.amount || 0),
      pendingCommissions: Number(pendingCommissions._sum.amount || 0),
      totalPayouts: Number(totalPayouts._sum.amount || 0),
      pendingPayouts: Number(pendingPayouts._sum.amount || 0),
      referralCode: user?.referralCode || '',
    };
  }

  async getReferrals(userId: string) {
    const referrals = await this.prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        balance: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return referrals;
  }

  async getCommissions(userId: string) {
    const commissions = await this.prisma.transaction.findMany({
      where: {
        userId: userId,
        type: 'REFERRAL',
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
      orderBy: { createdAt: 'desc' },
    });

    return commissions;
  }

  async requestPayout(userId: string, payoutDto: any) {
    // Проверяем доступную сумму для выплаты
    const availableAmount = await this.prisma.transaction.aggregate({
      where: {
        userId: userId,
        type: 'REFERRAL',
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const totalPayouts = await this.prisma.payout.aggregate({
      where: {
        userId: userId,
        status: { in: ['PENDING', 'COMPLETED'] },
      },
      _sum: { amount: true },
    });

    const availableBalance = (availableAmount._sum.amount?.toNumber() || 0) - (totalPayouts._sum.amount?.toNumber() || 0);

    if (payoutDto.amount > availableBalance) {
      throw new ForbiddenException('Insufficient balance for payout');
    }

    const payout = await this.prisma.payout.create({
      data: {
        userId: userId,
        amount: payoutDto.amount,
        status: 'PENDING',
        method: payoutDto.paymentMethod,
        metadata: payoutDto.accountDetails,
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

    return payout;
  }

  async getPayouts(userId: string) {
    const payouts = await this.prisma.payout.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return payouts;
  }
}
