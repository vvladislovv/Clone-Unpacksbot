const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testFrontendRequest() {
  try {
    console.log('🧪 Тестируем запрос как фронтенд...');
    
    // Авторизуемся
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      identifier: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('🔑 Авторизованы как:', loginResponse.data.user.username);
    
    // Получим список сделок
    const dealsResponse = await axios.get(`${API_URL}/admin/deals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📋 Найдено сделок:', dealsResponse.data.length);
    
    if (dealsResponse.data.length > 0) {
      const deal = dealsResponse.data[0];
      console.log('🎯 Тестируем сделку:', deal.id, 'статус:', deal.status);
      
      // Тестируем именно тот запрос, который отправляет фронтенд
      console.log('\n🔄 Тестируем запрос как фронтенд...');
      
      // Симулируем запрос фронтенда с DELIVERED (если он где-то остался)
      try {
        const response = await axios.put(`${API_URL}/admin/deals/${deal.id}/status`, 
          { status: 'DELIVERED' }, // Пробуем DELIVERED
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('✅ DELIVERED: Успешно');
      } catch (error) {
        console.log('❌ DELIVERED: Ошибка (ожидаемо)');
        console.log('📊 Статус:', error.response?.status);
        console.log('📋 Сообщение:', error.response?.data?.message);
      }
      
      // Тестируем COMPLETED
      try {
        const response = await axios.put(`${API_URL}/admin/deals/${deal.id}/status`, 
          { status: 'COMPLETED' },
          { 
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('✅ COMPLETED: Успешно');
        console.log('📊 Новый статус:', response.data.status);
      } catch (error) {
        console.log('❌ COMPLETED: Ошибка');
        console.log('📊 Статус:', error.response?.status);
        console.log('📋 Сообщение:', error.response?.data?.message);
      }
      
    } else {
      console.log('❌ Нет сделок для тестирования');
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error.response?.data || error.message);
  }
}

testFrontendRequest();
