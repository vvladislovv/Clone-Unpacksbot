# 🚀 UnpacksBot Backend API

## 📋 Описание
Backend API для платформы UnpacksBot - маркетплейс для продажи товаров с Wildberries.

## 🛠️ Технологии
- **Node.js** + **TypeScript**
- **NestJS** - фреймворк
- **PostgreSQL** - база данных
- **Prisma** - ORM
- **JWT** - авторизация
- **Docker** - контейнеризация

## 🚀 Быстрый старт

### 1. Установка
```bash
npm install
```

### 2. Настройка базы данных
```bash
# Создание миграции
npx prisma migrate dev

# Заполнение тестовыми данными
npx ts-node src/prisma/seed-optimized.ts
```

### 3. Запуск
```bash
# Разработка
npm run start:dev

# Продакшн
npm run build
npm run start:prod
```

## 📚 API Документация
Полная документация всех 85 ручек с примерами вызовов: [API_ENDPOINTS.md](./API_ENDPOINTS.md)

## 🔐 Тестовые аккаунты
- **Админ:** `admin` / `admin123`
- **Пользователи:** `user1` - `user10` / `user{номер}123`

## 📊 Статистика
- **Ручек:** 85
- **Модулей:** 12
- **Моделей БД:** 15
- **Статус:** ✅ Оптимизировано и готово к использованию
