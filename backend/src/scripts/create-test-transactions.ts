import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function createTestTransactions() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log('🔄 Создаем тестовые транзакции...');

  try {
    // Найдем первого пользователя или создадим тестового
    let user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('👤 Создаем тестового пользователя...');
      user = await prisma.user.create({
        data: {
          telegramId: '123456789',
          username: 'test_user',
          email: 'test@example.com',
          firstName: 'Тест',
          lastName: 'Пользователь',
          role: 'SELLER',
          balance: 10000,
          referralCode: 'TEST123',
          isActive: true,
          isVerified: true
        }
      });
      console.log(`✅ Создан пользователь: ${user.id}`);
    }

    // Создаем тестовые транзакции
    const transactions = [
      {
        userId: user.id,
        type: 'DEPOSIT' as const,
        amount: 5000,
        status: 'COMPLETED' as const,
        description: 'Пополнение баланса через карту',
        createdAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        userId: user.id,
        type: 'PAYMENT' as const,
        amount: 1500,
        status: 'COMPLETED' as const,
        description: 'Покупка товара "AirPods Pro"',
        createdAt: new Date('2024-01-14T15:20:00Z')
      },
      {
        userId: user.id,
        type: 'REFERRAL' as const,
        amount: 2500,
        status: 'COMPLETED' as const,
        description: 'Партнерская комиссия',
        createdAt: new Date('2024-01-13T09:15:00Z')
      },
      {
        userId: user.id,
        type: 'COMMISSION' as const,
        amount: 500,
        status: 'COMPLETED' as const,
        description: 'Комиссия платформы',
        createdAt: new Date('2024-01-12T14:45:00Z')
      },
      {
        userId: user.id,
        type: 'WITHDRAWAL' as const,
        amount: 2000,
        status: 'PENDING' as const,
        description: 'Вывод средств на карту',
        createdAt: new Date('2024-01-11T11:30:00Z')
      }
    ];

    for (const transactionData of transactions) {
      const transaction = await prisma.transaction.create({
        data: transactionData
      });
      console.log(`✅ Создана транзакция: ${transaction.id} - ${transaction.description}`);
    }

    console.log(`🎉 Создано транзакций: ${transactions.length}`);
    
    // Покажем статистику
    const totalTransactions = await prisma.transaction.count({
      where: { userId: user.id }
    });
    console.log(`📊 Всего транзакций у пользователя: ${totalTransactions}`);

  } catch (error) {
    console.error('❌ Ошибка создания транзакций:', error);
  } finally {
    await app.close();
  }
}

createTestTransactions().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
