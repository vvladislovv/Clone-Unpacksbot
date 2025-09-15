const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserStats() {
  try {
    console.log('📊 Проверяем статистику для разных пользователей...');
    
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
        role: true
      }
    });
    
    console.log(`Найдено пользователей с данными: ${users.length}`);
    
    for (const user of users) {
      console.log(`\n👤 Пользователь: ${user.username || user.email} (${user.role})`);
      
      // Продукты
      const products = await prisma.product.count({
        where: { sellerId: user.id }
      });
      
      // Сделки
      const deals = await prisma.deal.count({
        where: {
          OR: [
            { buyerId: user.id },
            { sellerId: user.id }
          ]
        }
      });
      
      // Транзакции
      const transactions = await prisma.transaction.count({
        where: { userId: user.id }
      });
      
      // Рефералы
      const referrals = await prisma.user.count({
        where: { referredById: user.id }
      });
      
      console.log(`  - Продукты: ${products}`);
      console.log(`  - Сделки: ${deals}`);
      console.log(`  - Транзакции: ${transactions}`);
      console.log(`  - Рефералы: ${referrals}`);
      
      if (products > 0 || deals > 0 || transactions > 0 || referrals > 0) {
        console.log(`  ✅ У этого пользователя есть данные для статистики`);
        
        // Попробуем получить статистику через API
        try {
          const axios = require('axios');
          
          const loginResponse = await axios.post('http://localhost:3000/auth/login', {
            identifier: user.email,
            password: 'password123'
          });
          
          const token = loginResponse.data.access_token;
          
          const statsResponse = await axios.get('http://localhost:3000/statistics/user?period=30d', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`  📊 API статистика:`, JSON.stringify(statsResponse.data, null, 2));
          break; // Остановимся на первом успешном пользователе
          
        } catch (apiError) {
          console.log(`  ❌ Ошибка API: ${apiError.response?.data?.message || apiError.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStats();
