const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseData() {
  try {
    console.log('🔍 Проверяем данные в базе данных...\n');
    
    // Найдем пользователей с данными
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { products: { some: {} } },
          { dealsAsBuyer: { some: {} } },
          { dealsAsSeller: { some: {} } },
          { transactions: { some: {} } },
          { referrals: { some: {} } }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    console.log(`📊 Найдено пользователей с данными: ${users.length}\n`);
    
    for (const user of users) {
      console.log(`👤 Пользователь: ${user.username || user.email} (${user.role})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Имя: ${user.firstName} ${user.lastName}`);
      
      // Продукты
      const products = await prisma.product.findMany({
        where: { sellerId: user.id },
        select: { id: true, title: true, price: true, isActive: true }
      });
      
      // Сделки
      const deals = await prisma.deal.findMany({
        where: {
          OR: [
            { buyerId: user.id },
            { sellerId: user.id }
          ]
        },
        select: { id: true, status: true, amount: true }
      });
      
      // Транзакции
      const transactions = await prisma.transaction.findMany({
        where: { userId: user.id },
        select: { id: true, type: true, amount: true, status: true }
      });
      
      // Рефералы
      const referrals = await prisma.user.findMany({
        where: { referredById: user.id },
        select: { id: true, username: true, email: true }
      });
      
      console.log(`\n   📦 Продукты (${products.length}):`);
      products.forEach((product, index) => {
        console.log(`      ${index + 1}. ${product.title} - ₽${product.price} (${product.isActive ? 'активен' : 'неактивен'})`);
      });
      
      console.log(`\n   🤝 Сделки (${deals.length}):`);
      deals.forEach((deal, index) => {
        console.log(`      ${index + 1}. ID: ${deal.id} - ₽${deal.amount} - ${deal.status}`);
      });
      
      console.log(`\n   💰 Транзакции (${transactions.length}):`);
      transactions.forEach((transaction, index) => {
        console.log(`      ${index + 1}. ${transaction.type} - ₽${transaction.amount} - ${transaction.status}`);
      });
      
      console.log(`\n   👥 Рефералы (${referrals.length}):`);
      referrals.forEach((referral, index) => {
        console.log(`      ${index + 1}. ${referral.username || referral.email}`);
      });
      
      // Статистика для API
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.isActive).length;
      const totalDeals = deals.length;
      const completedDeals = deals.filter(d => d.status === 'COMPLETED').length;
      const totalTransactions = transactions.length;
      const completedTransactions = transactions.filter(t => t.status === 'COMPLETED').length;
      const pendingTransactions = transactions.filter(t => t.status === 'PENDING').length;
      const totalReferrals = referrals.length;
      
      // Доходы и расходы
      const revenueTransactions = transactions.filter(t => 
        ['DEPOSIT', 'COMMISSION', 'REFERRAL', 'CAMPAIGN_PAYMENT'].includes(t.type) && t.status === 'COMPLETED'
      );
      const expenseTransactions = transactions.filter(t => 
        ['WITHDRAWAL', 'PAYMENT'].includes(t.type) && t.status === 'COMPLETED'
      );
      
      const totalRevenue = revenueTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalSpent = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const referralEarnings = transactions
        .filter(t => t.type === 'REFERRAL' && t.status === 'COMPLETED')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      console.log(`\n   📊 СТАТИСТИКА ДЛЯ API:`);
      console.log(`      - totalProducts: ${totalProducts}`);
      console.log(`      - activeProducts: ${activeProducts}`);
      console.log(`      - totalDeals: ${totalDeals}`);
      console.log(`      - completedDeals: ${completedDeals}`);
      console.log(`      - totalTransactions: ${totalTransactions}`);
      console.log(`      - completedTransactions: ${completedTransactions}`);
      console.log(`      - pendingTransactions: ${pendingTransactions}`);
      console.log(`      - totalReferrals: ${totalReferrals}`);
      console.log(`      - totalRevenue: ₽${totalRevenue}`);
      console.log(`      - totalSpent: ₽${totalSpent}`);
      console.log(`      - referralEarnings: ₽${referralEarnings}`);
      
      console.log('\n' + '='.repeat(80) + '\n');
    }
    
    // Общая статистика по базе
    console.log('📈 ОБЩАЯ СТАТИСТИКА ПО БАЗЕ:');
    
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalDeals = await prisma.deal.count();
    const totalTransactions = await prisma.transaction.count();
    
    console.log(`- Всего пользователей: ${totalUsers}`);
    console.log(`- Всего продуктов: ${totalProducts}`);
    console.log(`- Всего сделок: ${totalDeals}`);
    console.log(`- Всего транзакций: ${totalTransactions}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseData();
