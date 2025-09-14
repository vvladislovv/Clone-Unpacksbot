const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createNotifications() {
  try {
    console.log('🔔 Создание тестовых уведомлений...');

    // Найдем пользователя testuser
    const user = await prisma.user.findFirst({
      where: { username: 'testuser' }
    });

    if (!user) {
      console.error('❌ Пользователь testuser не найден');
      return;
    }

    console.log(`✅ Найден пользователь: ${user.username} (${user.id})`);

    // Создаем тестовые уведомления
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Заказ подтвержден',
          message: 'Ваш заказ #12345 успешно подтвержден продавцом',
          type: 'SUCCESS',
          isRead: false,
        }
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Новое сообщение',
          message: 'У вас новое сообщение от продавца по заказу #12340',
          type: 'INFO',
          isRead: false,
        }
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Заказ отправлен',
          message: 'Заказ #12338 отправлен. Трек-номер: 1234567890',
          type: 'INFO',
          isRead: true,
        }
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Проблема с оплатой',
          message: 'Не удалось обработать платеж. Проверьте данные карты',
          type: 'ERROR',
          isRead: true,
        }
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Заказ доставлен',
          message: 'Ваш заказ #12335 успешно доставлен. Оцените покупку!',
          type: 'SUCCESS',
          isRead: true,
        }
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Новое предложение',
          message: 'Скидка 20% на товары из категории "Электроника"',
          type: 'INFO',
          isRead: true,
        }
      })
    ]);

    console.log(`✅ Создано уведомлений: ${notifications.length}`);
    
    // Показываем статистику
    const totalNotifications = await prisma.notification.count({
      where: { userId: user.id }
    });
    const unreadNotifications = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    });

    console.log(`📊 Статистика уведомлений:`);
    console.log(`   Всего: ${totalNotifications}`);
    console.log(`   Непрочитанных: ${unreadNotifications}`);

  } catch (error) {
    console.error('❌ Ошибка создания уведомлений:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNotifications();
