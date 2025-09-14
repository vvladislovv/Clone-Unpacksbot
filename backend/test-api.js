const axios = require('axios');

// Конфигурация
const BASE_URL = 'http://localhost:3000';
const API_URL = BASE_URL;

// Глобальные переменные для тестирования
let authToken = '';
let testUserId = '';
let testProductId = '';
let testDealId = '';
let testPaymentId = '';
let testCampaignId = '';
let testChatId = '';
let testMessageId = '';

// Утилиты
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = (message, data = null) => {
  console.log(`\n🔍 ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const testEndpoint = async (name, method, url, data = null, headers = {}) => {
  try {
    log(`Testing ${name}`, { method, url, data });
    
    const config = {
      method,
      url: `${API_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    log(`✅ ${name} - SUCCESS`, {
      status: response.status,
      data: response.data
    });
    
    return response.data;
  } catch (error) {
    log(`❌ ${name} - ERROR`, {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    throw error;
  }
};

// Тесты аутентификации
const testAuth = async () => {
  log('=== TESTING AUTHENTICATION ===');
  
  try {
    // Регистрация пользователя
    const timestamp = Date.now();
    const registerData = await testEndpoint(
      'User Registration',
      'POST',
      '/auth/register',
      {
        username: `testuser${timestamp}`,
        email: `test${timestamp}@example.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      }
    );
    
    authToken = registerData.token;
    testUserId = registerData.user.id;
    
    // Вход в систему
    const loginData = await testEndpoint(
      'User Login',
      'POST',
      '/auth/login',
      {
        identifier: `testuser${timestamp}`,
        password: 'password123'
      }
    );
    
    authToken = loginData.token;
    
    // Получение профиля
    await testEndpoint(
      'Get Profile',
      'GET',
      '/auth/me',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Authentication tests completed successfully');
  } catch (error) {
    log('❌ Authentication tests failed', error.message);
    throw error;
  }
};

// Тесты пользователей
const testUsers = async () => {
  log('=== TESTING USERS ===');
  
  try {
    // Получение пользователя по ID
    await testEndpoint(
      'Get User by ID',
      'GET',
      `/users/${testUserId}`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Обновление профиля
    await testEndpoint(
      'Update Profile',
      'PUT',
      '/users/profile',
      {
        firstName: 'Updated Test',
        lastName: 'Updated User'
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение рефералов
    await testEndpoint(
      'Get Referrals',
      'GET',
      '/users/referrals',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение баланса
    await testEndpoint(
      'Get Balance',
      'GET',
      '/users/balance',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение уведомлений
    await testEndpoint(
      'Get Notifications',
      'GET',
      '/users/notifications',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Users tests completed successfully');
  } catch (error) {
    log('❌ Users tests failed', error.message);
    throw error;
  }
};

// Тесты товаров
const testProducts = async () => {
  log('=== TESTING PRODUCTS ===');
  
  try {
    // Создание товара
    const timestamp = Date.now();
    const productData = await testEndpoint(
      'Create Product',
      'POST',
      '/products',
      {
        wbArticle: `WB${timestamp}`,
        title: `Test Product ${timestamp}`,
        description: 'Test product description',
        price: 1000,
        category: 'Electronics',
        brand: 'TestBrand'
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    testProductId = productData.id;
    
    // Получение всех товаров
    await testEndpoint(
      'Get All Products',
      'GET',
      '/products',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение товара по ID
    await testEndpoint(
      'Get Product by ID',
      'GET',
      `/products/${testProductId}`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение моих товаров
    await testEndpoint(
      'Get My Products',
      'GET',
      '/products/my/products',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Обновление товара
    await testEndpoint(
      'Update Product',
      'PUT',
      `/products/${testProductId}`,
      {
        title: 'Updated Test Product',
        description: 'Updated description',
        price: 1500
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Products tests completed successfully');
  } catch (error) {
    log('❌ Products tests failed', error.message);
    throw error;
  }
};

// Тесты кампаний
const testCampaigns = async () => {
  log('=== TESTING CAMPAIGNS ===');
  
  try {
    // Создание кампании
    const campaignData = await testEndpoint(
      'Create Campaign',
      'POST',
      '/campaigns',
      {
        title: 'Test Campaign',
        description: 'Test campaign description',
        type: 'product',
        budget: 10000,
        pricePerClick: 50,
        maxClicks: 200,
        productId: testProductId
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    testCampaignId = campaignData.id;
    
    // Получение всех кампаний
    await testEndpoint(
      'Get All Campaigns',
      'GET',
      '/campaigns',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение кампании по ID
    await testEndpoint(
      'Get Campaign by ID',
      'GET',
      `/campaigns/${testCampaignId}`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение моих кампаний
    await testEndpoint(
      'Get My Campaigns',
      'GET',
      '/campaigns/my/campaigns',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Обновление кампании
    await testEndpoint(
      'Update Campaign',
      'PUT',
      `/campaigns/${testCampaignId}`,
      {
        title: 'Updated Test Campaign',
        description: 'Updated campaign description',
        budget: 15000
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Запуск кампании
    await testEndpoint(
      'Start Campaign',
      'POST',
      `/campaigns/${testCampaignId}/start`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Запись клика
    await testEndpoint(
      'Record Campaign Click',
      'POST',
      `/campaigns/${testCampaignId}/click`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Пауза кампании
    await testEndpoint(
      'Pause Campaign',
      'POST',
      `/campaigns/${testCampaignId}/pause`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Campaigns tests completed successfully');
  } catch (error) {
    log('❌ Campaigns tests failed', error.message);
    throw error;
  }
};

// Тесты чатов
const testChats = async () => {
  log('=== TESTING CHATS ===');
  
  try {
    // Создание чата
    const chatData = await testEndpoint(
      'Create Chat',
      'POST',
      '/chat/chats',
      {
        name: 'Test Chat',
        isGroup: false
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    testChatId = chatData.id;
    
    // Получение чатов
    await testEndpoint(
      'Get Chats',
      'GET',
      '/chat/chats',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Отправка сообщения
    const messageData = await testEndpoint(
      'Send Message',
      'POST',
      `/chat/chats/${testChatId}/messages`,
      {
        content: 'Test message',
        type: 'TEXT'
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    testMessageId = messageData.id;
    
    // Получение сообщений чата
    await testEndpoint(
      'Get Chat Messages',
      'GET',
      `/chat/chats/${testChatId}/messages`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Редактирование сообщения
    await testEndpoint(
      'Edit Message',
      'PUT',
      `/chat/messages/${testMessageId}`,
      {
        content: 'Updated test message'
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Удаление сообщения
    await testEndpoint(
      'Delete Message',
      'DELETE',
      `/chat/messages/${testMessageId}`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Chats tests completed successfully');
  } catch (error) {
    log('❌ Chats tests failed', error.message);
    throw error;
  }
};

// Тесты транзакций
const testTransactions = async () => {
  log('=== TESTING TRANSACTIONS ===');
  
  try {
    // Получение транзакций
    await testEndpoint(
      'Get Transactions',
      'GET',
      '/transactions',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение всех данных о транзакциях
    await testEndpoint(
      'Get All Transaction Data',
      'GET',
      '/transactions/all-data',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение статистики транзакций
    await testEndpoint(
      'Get Transaction Stats',
      'GET',
      '/transactions/stats',
      { period: '30d' },
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Создание платежа для пополнения баланса
    const paymentData = await testEndpoint(
      'Create Payment for Balance',
      'POST',
      '/payment/create',
      {
        amount: 1000,
        paymentMethod: 'card',
        description: 'Balance top-up for testing',
        metadata: {
          test: true
        }
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Подтверждение платежа
    await testEndpoint(
      'Confirm Payment',
      'POST',
      `/payment/${paymentData.id}/confirm`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Запрос на вывод средств
    await testEndpoint(
      'Request Withdrawal',
      'POST',
      '/transactions/withdrawal',
      {
        amount: 500,
        method: 'bank_card',
        details: {
          cardNumber: '1234567890123456'
        }
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Transactions tests completed successfully');
  } catch (error) {
    log('❌ Transactions tests failed', error.message);
    throw error;
  }
};

// Тесты платежей
const testPayments = async () => {
  log('=== TESTING PAYMENTS ===');
  
  try {
    // Создание платежа
    const paymentData = await testEndpoint(
      'Create Payment',
      'POST',
      '/payment/create',
      {
        amount: 1000,
        paymentMethod: 'card',
        description: 'Test payment',
        metadata: {
          productId: testProductId
        }
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    testPaymentId = paymentData.id;
    
    // Получение платежа по ID
    await testEndpoint(
      'Get Payment by ID',
      'GET',
      `/payment/${testPaymentId}`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Подтверждение платежа
    await testEndpoint(
      'Confirm Payment',
      'POST',
      `/payment/${testPaymentId}/confirm`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Payments tests completed successfully');
  } catch (error) {
    log('❌ Payments tests failed', error.message);
    throw error;
  }
};

// Тесты сделок
const testDeals = async () => {
  log('=== TESTING DEALS ===');
  
  try {
    // Создание сделки
    const dealData = await testEndpoint(
      'Create Deal',
      'POST',
      '/deals',
      {
        productId: testProductId,
        amount: 1000,
        description: 'Test deal'
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    testDealId = dealData.id;
    
    // Получение всех сделок
    await testEndpoint(
      'Get All Deals',
      'GET',
      '/deals',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение сделки по ID
    await testEndpoint(
      'Get Deal by ID',
      'GET',
      `/deals/${testDealId}`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение моих сделок
    await testEndpoint(
      'Get My Deals',
      'GET',
      '/deals/my/deals',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Обновление сделки
    await testEndpoint(
      'Update Deal',
      'PUT',
      `/deals/${testDealId}`,
      {
        status: 'CONFIRMED',
        description: 'Updated test deal'
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Отмена сделки
    await testEndpoint(
      'Cancel Deal',
      'POST',
      `/deals/${testDealId}/cancel`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Deals tests completed successfully');
  } catch (error) {
    log('❌ Deals tests failed', error.message);
    throw error;
  }
};

// Тесты статистики
const testStatistics = async () => {
  log('=== TESTING STATISTICS ===');
  
  try {
    // Получение статистики пользователя
    await testEndpoint(
      'Get User Statistics',
      'GET',
      '/statistics/user',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение статистики товара
    await testEndpoint(
      'Get Product Statistics',
      'GET',
      `/statistics/product/${testProductId}`,
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение статистики продаж
    await testEndpoint(
      'Get Sales Statistics',
      'GET',
      '/statistics/sales',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Statistics tests completed successfully');
  } catch (error) {
    log('❌ Statistics tests failed', error.message);
    throw error;
  }
};

// Тесты поддержки
const testSupport = async () => {
  log('=== TESTING SUPPORT ===');
  
  try {
    // Отправка сообщения в поддержку
    await testEndpoint(
      'Send Support Message',
      'POST',
      '/support/message',
      {
        subject: 'Test Support Request',
        message: 'This is a test support message',
        priority: 'MEDIUM'
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение сообщений поддержки
    await testEndpoint(
      'Get Support Messages',
      'GET',
      '/support/messages',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Support tests completed successfully');
  } catch (error) {
    log('❌ Support tests failed', error.message);
    throw error;
  }
};

// Тесты академии
const testAcademy = async () => {
  log('=== TESTING ACADEMY ===');
  
  try {
    // Получение всех курсов
    await testEndpoint(
      'Get All Courses',
      'GET',
      '/academy/courses',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение курса по ID (если есть)
    try {
      await testEndpoint(
        'Get Course by ID',
        'GET',
        '/academy/courses/test-course-id',
        null,
        { Authorization: `Bearer ${authToken}` }
      );
    } catch (error) {
      log('Course not found (expected for test)');
    }
    
    // Получение прогресса
    await testEndpoint(
      'Get Academy Progress',
      'GET',
      '/academy/progress',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Academy tests completed successfully');
  } catch (error) {
    log('❌ Academy tests failed', error.message);
    throw error;
  }
};

// Тесты партнерской программы
const testAffiliate = async () => {
  log('=== TESTING AFFILIATE ===');
  
  try {
    // Получение статистики партнерской программы
    await testEndpoint(
      'Get Affiliate Stats',
      'GET',
      '/affiliate/stats',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение рефералов
    await testEndpoint(
      'Get Affiliate Referrals',
      'GET',
      '/affiliate/referrals',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение комиссий
    await testEndpoint(
      'Get Affiliate Commissions',
      'GET',
      '/affiliate/commissions',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Создание тестовой комиссии для выплаты
    try {
      await testEndpoint(
        'Create Test Commission',
        'POST',
        '/transactions/payment/create',
        {
          amount: 1000,
          paymentMethod: 'card',
          description: 'Test commission for affiliate payout',
          metadata: {
            type: 'REFERRAL',
            test: true
          }
        },
        { Authorization: `Bearer ${authToken}` }
      );
    } catch (error) {
      log('Test commission creation failed (expected)', error.message);
    }
    
    // Запрос на выплату (может не сработать из-за недостатка средств)
    try {
      await testEndpoint(
        'Request Affiliate Payout',
        'POST',
        '/affiliate/payout',
        {
          amount: 100,
          method: 'bank_card',
          details: {
            cardNumber: '1234567890123456'
          }
        },
        { Authorization: `Bearer ${authToken}` }
      );
    } catch (error) {
      log('Affiliate payout failed (expected due to insufficient balance)', error.message);
    }
    
    // Получение истории выплат
    await testEndpoint(
      'Get Affiliate Payouts',
      'GET',
      '/affiliate/payouts',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Affiliate tests completed successfully');
  } catch (error) {
    log('❌ Affiliate tests failed', error.message);
    throw error;
  }
};

// Тесты Telegram
const testTelegram = async () => {
  log('=== TESTING TELEGRAM ===');
  
  try {
    // Получение информации о пользователе Telegram
    await testEndpoint(
      'Get Telegram User Info',
      'GET',
      '/telegram/user/123456789',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение фото пользователя Telegram
    await testEndpoint(
      'Get Telegram User Photo',
      'GET',
      '/telegram/user/123456789/photo',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Поиск пользователя Telegram
    await testEndpoint(
      'Search Telegram User',
      'GET',
      '/telegram/search/testuser',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Верификация пользователя Telegram
    await testEndpoint(
      'Verify Telegram User',
      'POST',
      '/telegram/verify/123456789',
      {
        firstName: 'Telegram',
        lastName: 'User',
        username: 'telegram_user'
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Telegram tests completed successfully');
  } catch (error) {
    log('❌ Telegram tests failed', error.message);
    throw error;
  }
};

// Тесты социальных сетей
const testSocial = async () => {
  log('=== TESTING SOCIAL ===');
  
  try {
    // Подключение социальной сети
    await testEndpoint(
      'Connect Social Account',
      'POST',
      '/social/connect',
      {
        platform: 'telegram',
        username: 'testuser',
        url: 'https://t.me/testuser'
      },
      { Authorization: `Bearer ${authToken}` }
    );
    
    // Получение социальных ссылок
    await testEndpoint(
      'Get Social Links',
      'GET',
      '/social/links',
      null,
      { Authorization: `Bearer ${authToken}` }
    );
    
    log('✅ Social tests completed successfully');
  } catch (error) {
    log('❌ Social tests failed', error.message);
    throw error;
  }
};

// Тесты загрузки файлов
const testUpload = async () => {
  log('=== TESTING UPLOAD ===');
  
  try {
    // Создание тестового файла
    const FormData = require('form-data');
    const fs = require('fs');
    
    // Создаем временный файл для тестирования
    const testFilePath = '/tmp/test-file.txt';
    fs.writeFileSync(testFilePath, 'Test file content');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    
    // Загрузка файла
    const uploadResponse = await axios.post(`${API_URL}/upload/file`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${authToken}`
      }
    });
    
    log('✅ Upload file test completed', uploadResponse.data);
    
    // Удаляем временный файл
    fs.unlinkSync(testFilePath);
    
    log('✅ Upload tests completed successfully');
  } catch (error) {
    log('❌ Upload tests failed', error.message);
    throw error;
  }
};

// Основная функция тестирования
const runAllTests = async () => {
  console.log('🚀 Starting API Tests...\n');
  
  const startTime = Date.now();
  
  try {
    await testAuth();
    await delay(1000);
    
    await testUsers();
    await delay(1000);
    
    await testProducts();
    await delay(1000);
    
    await testCampaigns();
    await delay(1000);
    
    await testChats();
    await delay(1000);
    
    await testTransactions();
    await delay(1000);
    
    await testPayments();
    await delay(1000);
    
    await testDeals();
    await delay(1000);
    
    await testStatistics();
    await delay(1000);
    
    await testSupport();
    await delay(1000);
    
    await testAcademy();
    await delay(1000);
    
    await testAffiliate();
    await delay(1000);
    
    await testTelegram();
    await delay(1000);
    
    await testSocial();
    await delay(1000);
    
    await testUpload();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!', {
      duration: `${duration}s`,
      totalEndpoints: 50
    });
    
  } catch (error) {
    log('💥 TESTS FAILED', error.message);
    process.exit(1);
  }
};

// Запуск тестов
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testAuth,
  testUsers,
  testProducts,
  testCampaigns,
  testChats,
  testTransactions,
  testPayments,
  testDeals,
  testStatistics,
  testSupport,
  testAcademy,
  testAffiliate,
  testTelegram,
  testSocial,
  testUpload
};
