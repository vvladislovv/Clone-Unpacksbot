import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateData: any) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async remove(id: string) {
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  // Новые методы согласно требованиям
  async updateProfile(userId: string, updateProfileDto: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
        email: updateProfileDto.email,
        phone: updateProfileDto.phone,
        avatar: updateProfileDto.avatar,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return user;
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
        createdAt: true,
        balance: true,
      },
    });

    return referrals;
  }

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        balance: true,
        referralCode: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      balance: user.balance,
      referralCode: user.referralCode,
    };
  }

  async getNotifications(userId: string, limit: number = 50) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
        metadata: true,
      },
    });

    return notifications;
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { message: 'Notification marked as read' };
  }

  async markAllNotificationsAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read' };
  }

  // Новые методы для профиля
  async getPaymentMethods(userId: string) {
    // Моковые данные для демонстрации
    return [
      {
        id: '1',
        type: 'card',
        name: 'Основная карта',
        last4: '1234',
        isDefault: true
      },
      {
        id: '2',
        type: 'wallet',
        name: 'ЮMoney',
        isDefault: false
      }
    ];
  }

  async addPaymentMethod(userId: string, paymentDto: any) {
    // Моковая реализация
    return {
      id: Date.now().toString(),
      ...paymentDto,
      userId
    };
  }

  async removePaymentMethod(userId: string, paymentId: string) {
    // Моковая реализация
    return { message: 'Payment method removed successfully' };
  }

  async getSocialLinks(userId: string) {
    // Моковые данные для демонстрации
    return [
      {
        id: '1',
        platform: 'telegram',
        username: '@user_telegram',
        url: 'https://t.me/user_telegram',
        verified: true
      },
      {
        id: '2',
        platform: 'instagram',
        username: '@user_instagram',
        url: 'https://instagram.com/user_instagram',
        verified: false
      }
    ];
  }

  async addSocialLink(userId: string, socialDto: any) {
    // Моковая реализация
    return {
      id: Date.now().toString(),
      ...socialDto,
      userId,
      verified: false
    };
  }

  async removeSocialLink(userId: string, linkId: string) {
    // Моковая реализация
    return { message: 'Social link removed successfully' };
  }

  async getVerificationStatus(userId: string) {
    // Моковые данные для демонстрации
    return {
      status: 'not_submitted'
    };
  }

  async submitVerification(userId: string, verificationDto: any) {
    // Моковая реализация
    return {
      id: Date.now().toString(),
      ...verificationDto,
      userId,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
  }

  async getNotificationSettings(userId: string) {
    // Моковые данные для демонстрации
    return {
      email: true,
      push: true,
      sms: false,
      marketing: false
    };
  }

  async updateNotificationSettings(userId: string, settingsDto: any) {
    // Моковая реализация
    return {
      ...settingsDto,
      userId,
      updatedAt: new Date().toISOString()
    };
  }

  async findFirst() {
    return this.prisma.user.findFirst();
  }

  async getTransactions(userId: string) {
    try {
      // Получаем реальные транзакции из базы данных
      const transactions = await this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      console.log(`📊 Найдено транзакций для пользователя ${userId}: ${transactions.length}`);

      // Преобразуем в формат для фронтенда
      const formattedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        type: this.getTransactionTypeForFrontend(transaction.type),
        amount: Number(transaction.amount),
        description: transaction.description || this.getTransactionDescription(transaction.type),
        status: transaction.status.toLowerCase(),
        createdAt: transaction.createdAt.toISOString(),
        category: this.getTransactionCategory(transaction.type),
        paymentMethod: this.getPaymentMethodFromType(transaction.type)
      }));

      return formattedTransactions;
    } catch (error) {
      console.error('Ошибка получения транзакций:', error);
      throw error; // Пробрасываем ошибку вместо fallback
    }
  }

  private getTransactionTypeForFrontend(type: string): 'income' | 'expense' {
    switch (type) {
      case 'DEPOSIT':
      case 'REFERRAL':
      case 'COMMISSION':
        return 'income';
      case 'WITHDRAWAL':
      case 'PAYMENT':
      case 'CAMPAIGN_PAYMENT':
        return 'expense';
      default:
        return 'expense';
    }
  }

  private getTransactionDescription(type: string): string {
    switch (type) {
      case 'DEPOSIT':
        return 'Пополнение баланса';
      case 'WITHDRAWAL':
        return 'Вывод средств';
      case 'COMMISSION':
        return 'Комиссия платформы';
      case 'REFERRAL':
        return 'Партнерская комиссия';
      case 'CAMPAIGN_PAYMENT':
        return 'Оплата рекламной кампании';
      case 'PAYMENT':
        return 'Платеж за товар';
      default:
        return 'Транзакция';
    }
  }

  private getTransactionCategory(type: string): string {
    switch (type) {
      case 'DEPOSIT':
        return 'Пополнение';
      case 'WITHDRAWAL':
        return 'Вывод';
      case 'COMMISSION':
        return 'Комиссия';
      case 'REFERRAL':
        return 'Партнерство';
      case 'CAMPAIGN_PAYMENT':
        return 'Реклама';
      case 'PAYMENT':
        return 'Покупка';
      default:
        return 'Другое';
    }
  }

  private getPaymentMethodFromType(type: string): string {
    switch (type) {
      case 'DEPOSIT':
      case 'WITHDRAWAL':
        return 'card';
      case 'COMMISSION':
      case 'REFERRAL':
        return 'bank';
      case 'CAMPAIGN_PAYMENT':
      case 'PAYMENT':
        return 'wallet';
      default:
        return 'card';
    }
  }

  private getMockTransactions() {
    return [
      {
        id: '1',
        type: 'income',
        amount: 5000,
        description: 'Продажа товара "iPhone 15 Pro"',
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        category: 'Продажа',
        paymentMethod: 'card'
      },
      {
        id: '2',
        type: 'expense',
        amount: 1500,
        description: 'Покупка товара "AirPods Pro"',
        status: 'completed',
        createdAt: '2024-01-14T15:20:00Z',
        category: 'Покупка',
        paymentMethod: 'wallet'
      },
      {
        id: '3',
        type: 'income',
        amount: 2500,
        description: 'Партнерская комиссия',
        status: 'completed',
        createdAt: '2024-01-13T09:15:00Z',
        category: 'Партнерство',
        paymentMethod: 'bank'
      },
      {
        id: '4',
        type: 'expense',
        amount: 500,
        description: 'Комиссия платформы',
        status: 'completed',
        createdAt: '2024-01-12T14:45:00Z',
        category: 'Комиссия',
        paymentMethod: 'card'
      },
      {
        id: '5',
        type: 'income',
        amount: 3000,
        description: 'Продажа товара "MacBook Air"',
        status: 'pending',
        createdAt: '2024-01-11T11:30:00Z',
        category: 'Продажа',
        paymentMethod: 'card'
      }
    ];
  }
}
