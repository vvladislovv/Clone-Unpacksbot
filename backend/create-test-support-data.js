const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestSupportData() {
  try {
    console.log('🆘 Creating test support data...');

    // Найдем первого пользователя
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`✅ Found user: ${user.username} (${user.id})`);

    // Создадим несколько тикетов поддержки
    const supportTickets = [
      {
        userId: user.id,
        subject: 'Проблема с оплатой',
        message: 'Не могу оплатить заказ, карта отклоняется. Что делать?',
        status: 'OPEN',
        priority: 'HIGH'
      },
      {
        userId: user.id,
        subject: 'Вопрос по доставке',
        message: 'Когда будет доставлен мой заказ? Заказ #12345',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM'
      },
      {
        userId: user.id,
        subject: 'Предложение по улучшению',
        message: 'Можно ли добавить уведомления в Telegram?',
        status: 'RESOLVED',
        priority: 'LOW'
      },
      {
        userId: user.id,
        subject: 'Жалоба на продавца',
        message: 'Продавец не отвечает на сообщения уже 3 дня',
        status: 'OPEN',
        priority: 'HIGH'
      },
      {
        userId: user.id,
        subject: 'Техническая проблема',
        message: 'Сайт не загружается на мобильном устройстве',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM'
      }
    ];

    // Удалим старые тикеты
    await prisma.supportTicket.deleteMany({
      where: { userId: user.id }
    });

    // Создадим новые тикеты
    for (const ticketData of supportTickets) {
      await prisma.supportTicket.create({
        data: ticketData
      });
    }

    console.log(`✅ Created ${supportTickets.length} support tickets`);

    // Покажем статистику
    const stats = await prisma.supportTicket.aggregate({
      where: { userId: user.id },
      _count: true
    });

    const openTickets = await prisma.supportTicket.count({
      where: { 
        userId: user.id,
        status: 'OPEN'
      }
    });

    const inProgressTickets = await prisma.supportTicket.count({
      where: { 
        userId: user.id,
        status: 'IN_PROGRESS'
      }
    });

    const resolvedTickets = await prisma.supportTicket.count({
      where: { 
        userId: user.id,
        status: 'RESOLVED'
      }
    });

    console.log('\n📊 Support Statistics:');
    console.log(`Total tickets: ${stats._count}`);
    console.log(`Open: ${openTickets}`);
    console.log(`In Progress: ${inProgressTickets}`);
    console.log(`Resolved: ${resolvedTickets}`);

  } catch (error) {
    console.error('❌ Error creating test support data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestSupportData();
