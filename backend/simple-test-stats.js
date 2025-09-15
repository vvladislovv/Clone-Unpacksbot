const axios = require('axios');

async function testStats() {
  try {
    console.log('🔐 Авторизуемся...');
    
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      identifier: 'admin@unpacksbot.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Авторизован');
    
    console.log('\n📊 Получаем статистику...');
    
    const statsResponse = await axios.get('http://localhost:3000/statistics/user?period=30d', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Статистика получена:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

testStats();
