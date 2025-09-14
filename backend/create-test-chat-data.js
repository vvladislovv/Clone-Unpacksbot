const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestChatData() {
  try {
    console.log('💬 Creating test chat data...');

    // Найдем первого пользователя
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`✅ Found user: ${user.username} (${user.id})`);

    // Создадим чат с админом
    const adminChat = await prisma.chat.create({
      data: {
        name: 'Чат с поддержкой',
        isGroup: false,
        participants: {
          create: [
            {
              userId: user.id,
              isAdmin: false,
            }
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    console.log(`✅ Created admin chat: ${adminChat.id}`);

    // Создадим несколько сообщений в чате
    const messages = [
      {
        chatId: adminChat.id,
        senderId: user.id,
        content: 'Здравствуйте! У меня проблема с оплатой заказа.',
        type: 'TEXT'
      },
      {
        chatId: adminChat.id,
        senderId: user.id,
        content: 'Здравствуйте! Я помогу вам решить эту проблему. Расскажите подробнее, что именно происходит при оплате?',
        type: 'TEXT'
      },
      {
        chatId: adminChat.id,
        senderId: user.id,
        content: 'Карта отклоняется, хотя деньги есть. Ошибка "Недостаточно средств".',
        type: 'TEXT'
      },
      {
        chatId: adminChat.id,
        senderId: user.id,
        content: 'Понятно. Это может быть связано с лимитами банка или блокировкой международных платежей. Попробуйте связаться с вашим банком или используйте другую карту.',
        type: 'TEXT'
      },
      {
        chatId: adminChat.id,
        senderId: user.id,
        content: 'Спасибо! Попробую другую карту.',
        type: 'TEXT'
      }
    ];

    // Удалим старые сообщения
    await prisma.message.deleteMany({
      where: { chatId: adminChat.id }
    });

    // Создадим новые сообщения
    for (const messageData of messages) {
      await prisma.message.create({
        data: messageData
      });
    }

    console.log(`✅ Created ${messages.length} messages in admin chat`);

    // Создадим еще один чат - групповой
    const groupChat = await prisma.chat.create({
      data: {
        name: 'Общие вопросы',
        isGroup: true,
        participants: {
          create: [
            {
              userId: user.id,
              isAdmin: false,
            }
          ],
        },
      },
    });

    console.log(`✅ Created group chat: ${groupChat.id}`);

    // Покажем статистику
    const chatStats = await prisma.chat.count({
      where: { 
        participants: {
          some: { userId: user.id }
        }
      }
    });

    const messageStats = await prisma.message.count({
      where: { 
        chat: {
          participants: {
            some: { userId: user.id }
          }
        }
      }
    });

    console.log('\n📊 Chat Statistics:');
    console.log(`Total chats: ${chatStats}`);
    console.log(`Total messages: ${messageStats}`);

  } catch (error) {
    console.error('❌ Error creating test chat data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestChatData();
