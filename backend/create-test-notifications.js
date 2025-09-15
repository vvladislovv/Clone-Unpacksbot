const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestNotifications() {
  try {
    console.log('🔔 Creating test notifications...');

    // Найдем первого пользователя
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`✅ Found user: ${user.username} (${user.id})`);

    // Создадим несколько тестовых уведомлений
    const notifications = [
      {
        userId: user.id,
        title: 'Добро пожаловать!',
        message: 'Добро пожаловать в Unpacker Clone! Начните с изучения каталога товаров.',
        type: 'INFO',
        isRead: false,
        metadata: { category: 'welcome' }
      },
      {
        userId: user.id,
        title: 'Новый платеж получен',
        message: 'Ваш баланс пополнен на 1000 рублей. Спасибо за использование нашего сервиса!',
        type: 'SUCCESS',
        isRead: false,
        metadata: { amount: 1000, currency: 'RUB' }
      },
      {
        userId: user.id,
        title: 'Заказ подтвержден',
        message: 'Ваш заказ #12345 успешно подтвержден и отправлен на обработку.',
        type: 'SUCCESS',
        isRead: true,
        metadata: { orderId: '12345' }
      },
      {
        userId: user.id,
        title: 'Системное обновление',
        message: 'Планируется техническое обслуживание 15.01.2024 с 02:00 до 04:00 МСК.',
        type: 'WARNING',
        isRead: false,
        metadata: { maintenanceDate: '2024-01-15T02:00:00Z' }
      },
      {
        userId: user.id,
        title: 'Новое сообщение в чате',
        message: 'У вас новое сообщение от продавца по товару "Кроссовки Nike Air Max".',
        type: 'INFO',
        isRead: false,
        metadata: { chatId: 'chat_123', productId: 'prod_456' }
      },
      {
        userId: user.id,
        title: 'Реферальная комиссия',
        message: 'Вы получили 50 рублей за приглашение друга! Продолжайте приглашать и зарабатывайте.',
        type: 'SUCCESS',
        isRead: false,
        metadata: { amount: 50, referralCode: user.referralCode }
      },
      {
        userId: user.id,
        title: 'Кампания завершена',
        message: 'Ваша рекламная кампания "Летняя коллекция" успешно завершена. Просмотрите статистику.',
        type: 'INFO',
        isRead: true,
        metadata: { campaignId: 'camp_789' }
      },
      {
        userId: user.id,
        title: 'Ошибка платежа',
        message: 'Не удалось обработать ваш платеж. Проверьте данные карты и попробуйте снова.',
        type: 'ERROR',
        isRead: false,
        metadata: { paymentId: 'pay_999', errorCode: 'CARD_DECLINED' }
      }
    ];

    // Удалим старые уведомления для этого пользователя
    await prisma.notification.deleteMany({
      where: { userId: user.id }
    });

    // Создадим новые уведомления
    for (const notification of notifications) {
      await prisma.notification.create({
        data: notification
      });
    }

    console.log(`✅ Created ${notifications.length} test notifications for user ${user.username}`);

    // Покажем созданные уведомления
    const createdNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n📋 Created notifications:');
    createdNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. [${notif.type}] ${notif.title} - ${notif.isRead ? '✅ Read' : '❌ Unread'}`);
    });

  } catch (error) {
    console.error('❌ Error creating test notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNotifications();




