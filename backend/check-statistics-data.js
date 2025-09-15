const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStatisticsData() {
  try {
    console.log('📊 Проверяем данные для статистики...');
    
    // Найдем первого пользователя
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ Пользователи не найдены');
      return;
    }
    
    console.log(`✅ Пользователь: ${user.username || user.email} (${user.id})`);
    
    // Проверим продукты
    const totalProducts = await prisma.product.count({
      where: { sellerId: user.id }
    });
    
    const activeProducts = await prisma.product.count({
      where: { sellerId: user.id, isActive: true }
    });
    
    console.log(`\n📦 Продукты:`);
    console.log(`  Всего: ${totalProducts}`);
    console.log(`  Активных: ${activeProducts}`);
    
    // Проверим сделки
    const totalDeals = await prisma.deal.count({
      where: {
        OR: [
          { buyerId: user.id },
          { sellerId: user.id }
        ]
      }
    });
    
    const completedDeals = await prisma.deal.count({
      where: {
        OR: [
          { buyerId: user.id },
          { sellerId: user.id }
        ],
        status: 'COMPLETED'
      }
    });
    
    console.log(`\n🤝 Сделки:`);
    console.log(`  Всего: ${totalDeals}`);
    console.log(`  Завершенных: ${completedDeals}`);
    
    // Проверим транзакции
    const totalTransactions = await prisma.transaction.count({
      where: { userId: user.id }
    });
    
    const completedTransactions = await prisma.transaction.count({
      where: { 
        userId: user.id,
        status: 'COMPLETED'
      }
    });
    
    const pendingTransactions = await prisma.transaction.count({
      where: { 
        userId: user.id,
        status: 'PENDING'
      }
    });
    
    console.log(`\n💰 Транзакции:`);
    console.log(`  Всего: ${totalTransactions}`);
    console.log(`  Завершенных: ${completedTransactions}`);
    console.log(`  Ожидающих: ${pendingTransactions}`);
    
    // Проверим доходы
    const totalRevenue = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: {
          in: ['DEPOSIT', 'COMMISSION', 'REFERRAL', 'CAMPAIGN_PAYMENT']
        },
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    });
    
    const totalSpent = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: {
          in: ['WITHDRAWAL', 'PAYMENT']
        },
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    });
    
    console.log(`\n💵 Финансы:`);
    console.log(`  Доходы: ₽${Number(totalRevenue._sum.amount || 0)}`);
    console.log(`  Расходы: ₽${Number(totalSpent._sum.amount || 0)}`);
    console.log(`  Чистый доход: ₽${Number(totalRevenue._sum.amount || 0) - Number(totalSpent._sum.amount || 0)}`);
    
    // Проверим рефералов
    const totalReferrals = await prisma.user.count({
      where: { referredById: user.id }
    });
    
    const activeReferrals = await prisma.user.count({
      where: { 
        referredById: user.id,
        isActive: true
      }
    });
    
    const referralEarnings = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        type: 'REFERRAL',
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    });
    
    console.log(`\n👥 Рефералы:`);
    console.log(`  Всего: ${totalReferrals}`);
    console.log(`  Активных: ${activeReferrals}`);
    console.log(`  Заработано с рефералов: ₽${Number(referralEarnings._sum.amount || 0)}`);
    
    // Проверим, есть ли данные для статистики
    const hasData = totalProducts > 0 || totalDeals > 0 || totalTransactions > 0 || totalReferrals > 0;
    
    if (hasData) {
      console.log(`\n✅ В базе есть данные для статистики`);
    } else {
      console.log(`\n❌ В базе нет данных для статистики`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatisticsData();
