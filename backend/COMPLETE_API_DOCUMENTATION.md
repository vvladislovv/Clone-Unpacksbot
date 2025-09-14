# 📚 ПОЛНАЯ ДОКУМЕНТАЦИЯ API РУЧЕК

## 🚀 Базовый URL
```
http://localhost:3000
```

## 🔐 Аутентификация
Все защищенные ручки требуют JWT токен в заголовке:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📱 1. APP РУЧКИ

### GET `/` - Информация о приложении
**Описание:** Получить основную информацию о приложении
**Авторизация:** Не требуется

**JavaScript (fetch):**
```javascript
const response = await fetch('http://localhost:3000/');
const data = await response.json();
console.log(data);
```

**JavaScript (axios):**
```javascript
const response = await axios.get('http://localhost:3000/');
console.log(response.data);
```

---

## 🔐 2. AUTH РУЧКИ

### POST `/auth/register` - Регистрация пользователя
**Описание:** Создать нового пользователя
**Авторизация:** Не требуется

**Тело запроса:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User"
}
```

**JavaScript (fetch):**
```javascript
const response = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  })
});
const data = await response.json();
console.log('User created:', data.user);
console.log('Token:', data.token);
```

**JavaScript (axios):**
```javascript
const response = await axios.post('http://localhost:3000/auth/register', {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
});
console.log('User created:', response.data.user);
console.log('Token:', response.data.token);
```

### POST `/auth/login` - Авторизация
**Описание:** Войти в систему
**Авторизация:** Не требуется

**Тело запроса:**
```json
{
  "identifier": "testuser",
  "password": "password123"
}
```

**JavaScript (fetch):**
```javascript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    identifier: 'testuser',
    password: 'password123'
  })
});
const data = await response.json();
const token = data.token; // Сохранить токен
localStorage.setItem('token', token);
```

**JavaScript (axios):**
```javascript
const response = await axios.post('http://localhost:3000/auth/login', {
  identifier: 'testuser',
  password: 'password123'
});
const token = response.data.token;
localStorage.setItem('token', token);
```

### GET `/auth/me` - Получить профиль текущего пользователя
**Описание:** Получить информацию о текущем авторизованном пользователе
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const user = await response.json();
console.log('Current user:', user);
```

**JavaScript (axios):**
```javascript
const token = localStorage.getItem('token');
const response = await axios.get('http://localhost:3000/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
console.log('Current user:', response.data);
```

### POST `/auth/logout` - Выход из системы
**Описание:** Выйти из системы
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
await fetch('http://localhost:3000/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
localStorage.removeItem('token');
```

**JavaScript (axios):**
```javascript
const token = localStorage.getItem('token');
await axios.post('http://localhost:3000/auth/logout', {}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
localStorage.removeItem('token');
```

---

## 👥 3. USERS РУЧКИ

### GET `/users/:id` - Получить пользователя по ID
**Описание:** Получить информацию о конкретном пользователе
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const userId = 'user-id-here';
const response = await fetch(`http://localhost:3000/users/${userId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const user = await response.json();
console.log('User:', user);
```

### PUT `/users/profile` - Обновить профиль
**Описание:** Обновить профиль текущего пользователя
**Авторизация:** Требуется

**Тело запроса:**
```json
{
  "firstName": "Updated Name",
  "lastName": "Updated LastName"
}
```

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/users/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'Updated Name',
    lastName: 'Updated LastName'
  })
});
const updatedUser = await response.json();
console.log('Updated user:', updatedUser);
```

---

## 📦 4. PRODUCTS РУЧКИ

### POST `/products` - Создать продукт
**Описание:** Создать новый продукт
**Авторизация:** Требуется

**Тело запроса:**
```json
{
  "wbArticle": "WB123456",
  "title": "Test Product",
  "description": "Test product description",
  "price": 1000,
  "category": "Electronics",
  "brand": "TestBrand"
}
```

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    wbArticle: 'WB123456',
    title: 'Test Product',
    description: 'Test product description',
    price: 1000,
    category: 'Electronics',
    brand: 'TestBrand'
  })
});
const product = await response.json();
console.log('Product created:', product);
```

### GET `/products` - Получить все продукты
**Описание:** Получить список всех продуктов
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const products = await response.json();
console.log('All products:', products);
```

### GET `/products/my/products` - Получить мои продукты
**Описание:** Получить продукты текущего пользователя
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/products/my/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const myProducts = await response.json();
console.log('My products:', myProducts);
```

### GET `/products/:id` - Получить продукт по ID
**Описание:** Получить информацию о конкретном продукте
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const productId = 'product-id-here';
const response = await fetch(`http://localhost:3000/products/${productId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const product = await response.json();
console.log('Product:', product);
```

### PUT `/products/:id` - Обновить продукт
**Описание:** Обновить информацию о продукте
**Авторизация:** Требуется

**Тело запроса:**
```json
{
  "title": "Updated Product Title",
  "description": "Updated description",
  "price": 1500
}
```

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const productId = 'product-id-here';
const response = await fetch(`http://localhost:3000/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Updated Product Title',
    description: 'Updated description',
    price: 1500
  })
});
const updatedProduct = await response.json();
console.log('Updated product:', updatedProduct);
```

### DELETE `/products/:id` - Удалить продукт
**Описание:** Удалить продукт
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const productId = 'product-id-here';
const response = await fetch(`http://localhost:3000/products/${productId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
console.log('Product deleted');
```

---

## 💰 5. TRANSACTIONS РУЧКИ

### POST `/transactions/payment/create` - Создать платеж
**Описание:** Создать новый платеж
**Авторизация:** Требуется

**Тело запроса:**
```json
{
  "amount": 1000,
  "paymentMethod": "CARD",
  "description": "Test payment"
}
```

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/transactions/payment/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 1000,
    paymentMethod: 'CARD',
    description: 'Test payment'
  })
});
const payment = await response.json();
console.log('Payment created:', payment);
```

### GET `/transactions/payment/:id` - Получить платеж по ID
**Описание:** Получить информацию о платеже
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const paymentId = 'payment-id-here';
const response = await fetch(`http://localhost:3000/transactions/payment/${paymentId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const payment = await response.json();
console.log('Payment:', payment);
```

### POST `/transactions/payment/:id/confirm` - Подтвердить платеж
**Описание:** Подтвердить платеж (пополнить баланс)
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const paymentId = 'payment-id-here';
const response = await fetch(`http://localhost:3000/transactions/payment/${paymentId}/confirm`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const confirmedPayment = await response.json();
console.log('Payment confirmed:', confirmedPayment);
```

### POST `/transactions/withdrawal` - Запросить вывод средств
**Описание:** Запросить вывод средств с баланса
**Авторизация:** Требуется

**Тело запроса:**
```json
{
  "amount": 500,
  "description": "Withdrawal request"
}
```

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/transactions/withdrawal', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 500,
    description: 'Withdrawal request'
  })
});
const withdrawal = await response.json();
console.log('Withdrawal requested:', withdrawal);
```

### GET `/transactions/all-data` - Получить все данные о транзакциях
**Описание:** Получить полную информацию о транзакциях пользователя
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/transactions/all-data', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const transactionData = await response.json();
console.log('Transaction data:', transactionData);
```

---

## 🤝 6. DEALS РУЧКИ

### POST `/deals` - Создать сделку
**Описание:** Создать новую сделку
**Авторизация:** Требуется

**Тело запроса:**
```json
{
  "productId": "product-id-here",
  "amount": 1000,
  "description": "Deal description"
}
```

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/deals', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: 'product-id-here',
    amount: 1000,
    description: 'Deal description'
  })
});
const deal = await response.json();
console.log('Deal created:', deal);
```

### GET `/deals` - Получить все сделки
**Описание:** Получить список всех сделок
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/deals', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const deals = await response.json();
console.log('All deals:', deals);
```

### GET `/deals/my/deals` - Получить мои сделки
**Описание:** Получить сделки текущего пользователя
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/deals/my/deals', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const myDeals = await response.json();
console.log('My deals:', myDeals);
```

---

## 💬 7. CHAT РУЧКИ

### GET `/chat/chats` - Получить чаты пользователя
**Описание:** Получить список чатов текущего пользователя
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/chat/chats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const chats = await response.json();
console.log('User chats:', chats);
```

### POST `/chat/chats` - Создать чат
**Описание:** Создать новый чат
**Авторизация:** Требуется

**Тело запроса:**
```json
{
  "name": "Chat Name",
  "isGroup": false
}
```

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/chat/chats', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Chat Name',
    isGroup: false
  })
});
const chat = await response.json();
console.log('Chat created:', chat);
```

---

## 🎓 8. ACADEMY РУЧКИ

### GET `/academy/courses` - Получить все курсы
**Описание:** Получить список всех курсов
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/academy/courses', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const courses = await response.json();
console.log('All courses:', courses);
```

---

## 🤝 9. AFFILIATE РУЧКИ

### GET `/affiliate/stats` - Получить статистику партнерской программы
**Описание:** Получить статистику партнерской программы пользователя
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/affiliate/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const stats = await response.json();
console.log('Affiliate stats:', stats);
```

### GET `/affiliate/referrals` - Получить рефералов
**Описание:** Получить список рефералов пользователя
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/affiliate/referrals', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const referrals = await response.json();
console.log('Referrals:', referrals);
```

---

## 📊 10. STATISTICS РУЧКИ

### GET `/statistics/user` - Получить статистику пользователя
**Описание:** Получить статистику текущего пользователя
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/statistics/user', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const userStats = await response.json();
console.log('User statistics:', userStats);
```

### GET `/statistics/sales` - Получить статистику продаж
**Описание:** Получить статистику продаж
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/statistics/sales', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const salesStats = await response.json();
console.log('Sales statistics:', salesStats);
```

---

## 🆘 11. SUPPORT РУЧКИ

### POST `/support/message` - Отправить сообщение в поддержку
**Описание:** Отправить сообщение в службу поддержки
**Авторизация:** Требуется

**Тело запроса:**
```json
{
  "subject": "Support Subject",
  "message": "Support message text",
  "priority": "MEDIUM"
}
```

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/support/message', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subject: 'Support Subject',
    message: 'Support message text',
    priority: 'MEDIUM'
  })
});
const supportMessage = await response.json();
console.log('Support message sent:', supportMessage);
```

### GET `/support/messages` - Получить сообщения поддержки
**Описание:** Получить сообщения поддержки пользователя
**Авторизация:** Требуется

**JavaScript (fetch):**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/support/messages', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const supportMessages = await response.json();
console.log('Support messages:', supportMessages);
```

---

## 🔧 Утилиты для фронтенда

### Класс для работы с API
```javascript
class ApiClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Auth methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
    localStorage.removeItem('token');
  }

  // Products methods
  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async getProducts() {
    return this.request('/products');
  }

  async getMyProducts() {
    return this.request('/products/my/products');
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async updateProduct(id, productData) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  async deleteProduct(id) {
    return this.request(`/products/${id}`, { method: 'DELETE' });
  }

  // Transactions methods
  async createPayment(paymentData) {
    return this.request('/transactions/payment/create', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async confirmPayment(paymentId) {
    return this.request(`/transactions/payment/${paymentId}/confirm`, {
      method: 'POST'
    });
  }

  async requestWithdrawal(withdrawalData) {
    return this.request('/transactions/withdrawal', {
      method: 'POST',
      body: JSON.stringify(withdrawalData)
    });
  }

  async getTransactionData() {
    return this.request('/transactions/all-data');
  }

  // Deals methods
  async createDeal(dealData) {
    return this.request('/deals', {
      method: 'POST',
      body: JSON.stringify(dealData)
    });
  }

  async getDeals() {
    return this.request('/deals');
  }

  async getMyDeals() {
    return this.request('/deals/my/deals');
  }

  // Other methods...
}

// Использование
const api = new ApiClient();

// Регистрация и авторизация
try {
  await api.register({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  });
  
  const loginData = await api.login({
    identifier: 'testuser',
    password: 'password123'
  });
  
  console.log('Logged in:', loginData.user);
} catch (error) {
  console.error('Auth error:', error);
}

// Работа с продуктами
try {
  const product = await api.createProduct({
    wbArticle: 'WB123456',
    title: 'Test Product',
    description: 'Test description',
    price: 1000,
    category: 'Electronics',
    brand: 'TestBrand'
  });
  
  console.log('Product created:', product);
} catch (error) {
  console.error('Product error:', error);
}
```

## 📝 Коды ответов

- **200** - Успешный запрос
- **201** - Ресурс создан
- **400** - Неверный запрос
- **401** - Не авторизован
- **403** - Доступ запрещен
- **404** - Ресурс не найден
- **409** - Конфликт (например, пользователь уже существует)
- **500** - Внутренняя ошибка сервера

## 🚨 Обработка ошибок

```javascript
try {
  const response = await fetch('http://localhost:3000/products', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Success:', data);
} catch (error) {
  console.error('Error:', error.message);
  // Обработка ошибки
}
```
