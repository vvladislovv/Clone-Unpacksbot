# Unpacker Clone - Marketplace Platform

Современная платформа для продавцов, блогеров и менеджеров с расширенным функционалом рекламы и партнерских программ.

## 🚀 Особенности

- **Мультиролевая система**: Селлеры, блогеры, менеджеры
- **Расширенная реклама**: Товары WB + каналы/группы
- **Улучшенный чат**: Исправленные баги оригинала
- **Реферальная система**: 50% вознаграждение
- **Множественные агрегаторы**: Вывод на РФ карты
- **Telegram интеграция**: Бот для уведомлений

## 🏗️ Архитектура

```
├── backend/          # API сервер (Node.js + TypeScript)
├── frontend/         # Web приложение (Next.js)
├── telegram-bot/     # Telegram бот (Telegraf.js)
├── admin/           # Админ панель (Next.js)
├── database/        # SQL схемы и миграции
├── nginx/           # Reverse proxy конфигурация
└── docker-compose.yml
```

## 🛠️ Технологический стек

### Backend
- **Node.js** + **TypeScript**
- **Fastify** - высокопроизводительный веб-фреймворк
- **Prisma** - современная ORM
- **PostgreSQL** - основная база данных
- **Redis** - кэширование и сессии
- **Socket.io** - WebSocket для чата

### Frontend
- **Next.js 14** (App Router)
- **TypeScript** - типизация
- **TailwindCSS** + **Shadcn/ui** - UI компоненты
- **Zustand** - управление состоянием
- **React Query** - работа с API

### DevOps
- **Docker** + **Docker Compose**
- **Nginx** - reverse proxy
- **PM2** - процесс менеджер

## 🚀 Быстрый старт

1. **Клонирование и настройка**
```bash
git clone <repository>
cd unpacker-clone
cp env.example .env
```

2. **Запуск через Docker**
```bash
docker-compose up -d
```

3. **Доступ к сервисам**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Admin Panel: http://localhost:3002
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## 📋 Роли пользователей

### Селлер/Продавец/Админ
- Управление товарами WB
- Создание рекламных кампаний
- Аналитика продаж
- Финансовые операции

### Блогер/Рекламщик  
- Размещение рекламы товаров
- Реклама каналов/групп
- Партнерские программы
- Статистика по кликам

### Менеджер
- Координация между сторонами
- Модерация контента
- Техническая поддержка
- Управление спорами

## 🔧 Разработка

### Запуск в режиме разработки
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm run dev

# Telegram Bot
cd telegram-bot && npm run dev

# Admin Panel
cd admin && npm run dev
```

### База данных
```bash
# Миграции
cd backend && npx prisma migrate dev

# Seed данные
npx prisma db seed
```

## 📱 API Документация

API документация доступна по адресу: http://localhost:3001/docs

Основные эндпоинты:
- `POST /api/auth/login` - Авторизация
- `GET /api/users/profile` - Профиль пользователя
- `GET /api/products` - Список товаров
- `POST /api/campaigns` - Создание кампании
- `GET /api/chat/messages` - Сообщения чата

## 🔐 Безопасность

- JWT токены для аутентификации
- Rate limiting для API
- Валидация всех входных данных
- CORS настройки
- Шифрование паролей

## 📊 Мониторинг

- Логирование всех операций
- Метрики производительности
- Отслеживание ошибок
- Аналитика пользователей

## 🤝 Поддержка

Техническая поддержка: support@unpacker-clone.com
Документация: https://docs.unpacker-clone.com
