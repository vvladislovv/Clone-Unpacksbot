import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function migratePaymentsToTransactions() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log('🔄 Переносим данные из payments в transactions...');

  try {
    // Получаем все payments
    const payments = await prisma.payment.findMany();
    console.log(`📊 Найдено payments: ${payments.length}`);

    for (const payment of payments) {
      // Определяем тип транзакции на основе метода платежа
      let transactionType = 'PAYMENT';
      if (payment.method === 'CARD' || payment.method === 'BANK_TRANSFER') {
        transactionType = 'DEPOSIT';
      } else if (payment.method === 'CRYPTO') {
        transactionType = 'WITHDRAWAL';
      }

      // Маппим статусы
      let transactionStatus = 'PENDING';
      switch (payment.status) {
        case 'COMPLETED':
          transactionStatus = 'COMPLETED';
          break;
        case 'FAILED':
          transactionStatus = 'FAILED';
          break;
        case 'CANCELLED':
          transactionStatus = 'CANCELLED';
          break;
        case 'REFUNDED':
          transactionStatus = 'COMPLETED'; // REFUNDED -> COMPLETED для транзакций
          break;
        default:
          transactionStatus = 'PENDING';
      }

      // Создаем транзакцию
      await prisma.transaction.create({
        data: {
          userId: payment.userId,
          type: transactionType as any,
          amount: payment.amount,
          status: transactionStatus as any,
          description: payment.description || `Платеж через ${payment.method}`,
          externalId: payment.externalId,
          metadata: payment.metadata,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        }
      });
    }

    console.log(`✅ Перенесено ${payments.length} записей из payments в transactions`);

    // Теперь удаляем таблицу payments
    console.log('🗑️ Удаляем таблицу payments...');
    await prisma.$executeRaw`DROP TABLE IF EXISTS "payments" CASCADE`;
    console.log('✅ Таблица payments удалена');

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
  } finally {
    await app.close();
  }
}

migratePaymentsToTransactions().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
