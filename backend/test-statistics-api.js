const axios = require('axios');

async function testStatisticsAPI() {
  try {
    console.log('🧪 Тестируем API статистики...');
    
    // Попробуем разные пользователей
    const testUsers = [
      { email: 'admin@unpacksbot.com', password: 'admin123' },
      { email: 'test@example.com', password: 'password123' },
      { email: 'user1@test.com', password: 'password123' },
      { email: 'vlad.yelcheninov@gmail.com', password: 'password123' }
    ];
    
    let token = null;
    let userEmail = null;
    
    for (const user of testUsers) {
      try {
        console.log(`🔐 Пробуем авторизоваться как ${user.email}...`);
        
        const loginResponse = await axios.post('http://localhost:3000/auth/login', {
          identifier: user.email,
          password: user.password
        });
        
        token = loginResponse.data.access_token;
        userEmail = user.email;
        console.log(`✅ Успешно авторизован как ${user.email}`);
        break;
        
      } catch (error) {
        console.log(`❌ Не удалось авторизоваться как ${user.email}: ${error.response?.data?.message || error.message}`);
      }
    }
    
    if (!token) {
      console.log('❌ Не удалось авторизоваться ни с одним пользователем');
      return;
    }
    
    // Теперь тестируем эндпоинт статистики
    console.log(`\n📊 Тестируем эндпоинт /statistics/user для пользователя ${userEmail}...`);
    
    const statsResponse = await axios.get('http://localhost:3000/statistics/user?period=30d', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Статистика получена:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    
    // Проверим структуру ответа
    const stats = statsResponse.data;
    
    console.log('\n📋 Анализ данных:');
    console.log(`- Всего продуктов: ${stats.totalProducts || 0}`);
    console.log(`- Активных продуктов: ${stats.activeProducts || 0}`);
    console.log(`- Всего сделок: ${stats.totalDeals || 0}`);
    console.log(`- Завершенных сделок: ${stats.completedDeals || 0}`);
    console.log(`- Доходы: ₽${stats.totalRevenue || 0}`);
    console.log(`- Расходы: ₽${stats.totalSpent || 0}`);
    console.log(`- Всего рефералов: ${stats.totalReferrals || 0}`);
    console.log(`- Заработано с рефералов: ₽${stats.referralEarnings || 0}`);
    console.log(`- Всего транзакций: ${stats.totalTransactions || 0}`);
    console.log(`- Завершенных транзакций: ${stats.completedTransactions || 0}`);
    console.log(`- Ожидающих транзакций: ${stats.pendingTransactions || 0}`);
    console.log(`- Чистый доход: ₽${stats.netIncome || 0}`);
    console.log(`- Процент завершения: ${stats.completionRate || 0}%`);
    console.log(`- Средняя сумма транзакции: ₽${stats.averageTransactionAmount || 0}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

testStatisticsAPI();