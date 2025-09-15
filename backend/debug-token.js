const axios = require('axios');

async function debugToken() {
  try {
    console.log('🔐 Авторизуемся...');
    
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      identifier: 'user1@test.com',
      password: 'user1123'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Токен получен:', token.substring(0, 20) + '...');
    
    // Проверим профиль пользователя
    console.log('\n👤 Проверяем профиль...');
    
    try {
      const profileResponse = await axios.get('http://localhost:3000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Профиль получен:', JSON.stringify(profileResponse.data, null, 2));
      
    } catch (profileError) {
      console.log('❌ Ошибка профиля:', profileError.response?.data || profileError.message);
    }
    
    // Проверим статистику
    console.log('\n📊 Проверяем статистику...');
    
    try {
      const statsResponse = await axios.get('http://localhost:3000/statistics/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Статистика получена:', JSON.stringify(statsResponse.data, null, 2));
      
    } catch (statsError) {
      console.log('❌ Ошибка статистики:', statsError.response?.data || statsError.message);
      console.log('Статус:', statsError.response?.status);
      console.log('Заголовки:', statsError.response?.headers);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.response?.data || error.message);
  }
}

debugToken();
