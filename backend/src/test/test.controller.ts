import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('test')
export class TestController {
  constructor(private prisma: PrismaService) {}

  @Get('transactions')
  async getTransactions() {
    try {
      // Получаем первого пользователя
      const firstUser = await this.prisma.user.findFirst();
      if (!firstUser) {
        return { message: 'No users found', data: [] };
      }

      // Получаем транзакции
      const transactions = await this.prisma.transaction.findMany({
        where: { userId: firstUser.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      console.log(`📊 Найдено транзакций: ${transactions.length}`);

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

      return { data: formattedTransactions, message: 'Success' };
    } catch (error) {
      console.error('Error getting transactions:', error);
      return { message: 'Error getting transactions', error: error.message };
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
}

