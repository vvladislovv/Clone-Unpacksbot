import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаю заполнение базы данных тестовыми данными...');

  // Создаем настройки системы
  const settings = await prisma.settings.create({
    data: {
      referralCommission: 0.05, // 5%
      platformCommission: 0.1,  // 10%
      minWithdrawalAmount: 100,
      maxWithdrawalAmount: 100000,
      maintenanceMode: false,
      registrationEnabled: true,
    },
  });
  console.log('✅ Настройки системы созданы');

  // Создаем админа
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@unpacksbot.com',
      firstName: 'Администратор',
      lastName: 'Системы',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      balance: 10000,
      referralCode: 'ADMIN001',
    },
  });
  console.log('✅ Администратор создан');

  // Создаем тестовых пользователей
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const password = await bcrypt.hash(`user${i}123`, 10);
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@test.com`,
        firstName: `Пользователь`,
        lastName: `${i}`,
        passwordHash: password,
        role: i <= 3 ? 'SELLER' : i <= 6 ? 'BLOGGER' : 'MANAGER',
        isActive: true,
        isVerified: i <= 5,
        balance: Math.floor(Math.random() * 5000) + 1000,
        referralCode: `USER${i.toString().padStart(3, '0')}`,
        referredById: i > 1 ? users[Math.floor(Math.random() * (i - 1))].id : null,
      },
    });
    users.push(user);
  }
  console.log('✅ Тестовые пользователи созданы');

  // Создаем товары
  const products = [];
  const categories = ['Электроника', 'Одежда', 'Дом и сад', 'Спорт', 'Красота'];
  const brands = ['Samsung', 'Apple', 'Nike', 'Adidas', 'L\'Oreal', 'Maybelline'];

  for (let i = 1; i <= 20; i++) {
    const product = await prisma.product.create({
      data: {
        wbArticle: `WB${i.toString().padStart(6, '0')}`,
        title: `Товар ${i} - ${brands[Math.floor(Math.random() * brands.length)]}`,
        description: `Описание товара ${i}. Высокое качество, быстрая доставка.`,
        price: Math.floor(Math.random() * 10000) + 1000,
        images: [
          `https://picsum.photos/400/400?random=${i}_1`,
          `https://picsum.photos/400/400?random=${i}_2`,
        ],
        category: categories[Math.floor(Math.random() * categories.length)],
        brand: brands[Math.floor(Math.random() * brands.length)],
        rating: Math.random() * 2 + 3, // 3-5 звезд
        reviewsCount: Math.floor(Math.random() * 100),
        sellerId: users[Math.floor(Math.random() * 3)].id, // Первые 3 пользователя - продавцы
      },
    });
    products.push(product);
  }
  console.log('✅ Товары созданы');

  // Создаем транзакции
  for (let i = 1; i <= 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const types = ['DEPOSIT', 'WITHDRAWAL', 'COMMISSION', 'REFERRAL', 'CAMPAIGN_PAYMENT'];
    const statuses = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];
    
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: types[Math.floor(Math.random() * types.length)] as any,
        amount: Math.floor(Math.random() * 5000) + 100,
        commission: Math.floor(Math.random() * 100),
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        description: `Транзакция ${i}`,
        externalId: `EXT${i.toString().padStart(8, '0')}`,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
  console.log('✅ Транзакции созданы');

  // Создаем платежи
  for (let i = 1; i <= 30; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const methods = ['CARD', 'BANK_TRANSFER', 'CRYPTO', 'PAYPAL', 'YOOMONEY'];
    const statuses = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'];
    
    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: Math.floor(Math.random() * 3000) + 500,
        method: methods[Math.floor(Math.random() * methods.length)] as any,
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        externalId: `PAY${i.toString().padStart(8, '0')}`,
        description: `Платеж ${i}`,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
  console.log('✅ Платежи созданы');

  // Создаем сделки
  for (let i = 1; i <= 15; i++) {
    const buyer = users[Math.floor(Math.random() * users.length)];
    const seller = users[Math.floor(Math.random() * 3)]; // Первые 3 - продавцы
    const product = products[Math.floor(Math.random() * products.length)];
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
    
    await prisma.deal.create({
      data: {
        buyerId: buyer.id,
        sellerId: seller.id,
        productId: product.id,
        amount: product.price,
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        description: `Сделка по товару: ${product.title}`,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
  console.log('✅ Сделки созданы');

  // Создаем чаты
  const chats = [];
  for (let i = 1; i <= 5; i++) {
    const chat = await prisma.chat.create({
      data: {
        name: `Чат ${i}`,
        isGroup: i > 2,
      },
    });
    chats.push(chat);
  }
  console.log('✅ Чаты созданы');

  // Создаем участников чатов
  for (const chat of chats) {
    const participants = users.slice(0, Math.floor(Math.random() * 5) + 2);
    for (const user of participants) {
      await prisma.chatParticipant.create({
        data: {
          chatId: chat.id,
          userId: user.id,
          isAdmin: user.role === 'ADMIN',
        },
      });
    }
  }
  console.log('✅ Участники чатов созданы');

  // Создаем сообщения
  for (let i = 1; i <= 100; i++) {
    const chat = chats[Math.floor(Math.random() * chats.length)];
    const sender = users[Math.floor(Math.random() * users.length)];
    const types = ['TEXT', 'IMAGE', 'FILE', 'SYSTEM'];
    
    await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: sender.id,
        type: types[Math.floor(Math.random() * types.length)] as any,
        content: `Сообщение ${i}: Привет! Как дела?`,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
  console.log('✅ Сообщения созданы');

  // Создаем тикеты поддержки
  for (let i = 1; i <= 20; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const statuses = ['OPEN', 'IN_PROGRESS', 'CLOSED', 'RESOLVED'];
    
    await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: `Тикет поддержки ${i}`,
        message: `Описание проблемы ${i}. Нужна помощь!`,
        priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
      },
    });
  }
  console.log('✅ Тикеты поддержки созданы');

  // Создаем уведомления
  for (let i = 1; i <= 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const types = ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'PAYMENT', 'DEAL', 'SYSTEM'];
    
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: `Уведомление ${i}`,
        message: `Текст уведомления ${i}`,
        type: types[Math.floor(Math.random() * types.length)] as any,
        isRead: Math.random() > 0.5,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
  console.log('✅ Уведомления созданы');

  // Создаем курсы
  const courses = [];
  for (let i = 1; i <= 5; i++) {
    const course = await prisma.course.create({
      data: {
        title: `Курс ${i}: Основы маркетинга`,
        description: `Описание курса ${i}. Изучите основы маркетинга и продвижения.`,
        content: `Содержание курса ${i}...`,
        status: 'PUBLISHED',
        order: i,
      },
    });
    courses.push(course);
  }
  console.log('✅ Курсы созданы');

  // Создаем уроки
  for (const course of courses) {
    for (let i = 1; i <= 5; i++) {
      await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: `Урок ${i}: ${course.title}`,
          content: `Содержание урока ${i}...`,
          videoUrl: `https://picsum.photos/800/600?random=${i}_video`,
          duration: Math.floor(Math.random() * 60) + 15, // 15-75 минут
          status: 'PUBLISHED',
          order: i,
        },
      });
    }
  }
  console.log('✅ Уроки созданы');

  // Создаем завершения курсов
  const completionPromises = [];
  for (let i = 1; i <= 30; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const course = courses[Math.floor(Math.random() * courses.length)];
    const lessons = await prisma.lesson.findMany({
      where: { courseId: course.id },
    });
    
    for (const lesson of lessons) {
      completionPromises.push(
        prisma.courseCompletion.upsert({
          where: {
            userId_courseId_lessonId: {
              userId: user.id,
              courseId: course.id,
              lessonId: lesson.id,
            },
          },
          update: {
            completed: Math.random() > 0.3, // 70% завершены
          },
          create: {
            userId: user.id,
            courseId: course.id,
            lessonId: lesson.id,
            completed: Math.random() > 0.3, // 70% завершены
          },
        })
      );
    }
  }
  await Promise.all(completionPromises);
  console.log('✅ Завершения курсов созданы');

  // Создаем выплаты
  for (let i = 1; i <= 20; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const methods = ['BANK_TRANSFER', 'CARD', 'CRYPTO'];
    const statuses = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];
    
    await prisma.payout.create({
      data: {
        userId: user.id,
        amount: Math.floor(Math.random() * 2000) + 500,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        method: methods[Math.floor(Math.random() * methods.length)],
        externalId: `PAYOUT${i.toString().padStart(8, '0')}`,
        description: `Выплата ${i}`,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
  console.log('✅ Выплаты созданы');

  console.log('🎉 База данных успешно заполнена тестовыми данными!');
  console.log(`📊 Статистика:`);
  console.log(`   - Пользователи: ${users.length + 1} (включая админа)`);
  console.log(`   - Товары: ${products.length}`);
  console.log(`   - Транзакции: 50`);
  console.log(`   - Платежи: 30`);
  console.log(`   - Сделки: 15`);
  console.log(`   - Чаты: ${chats.length}`);
  console.log(`   - Сообщения: 100`);
  console.log(`   - Тикеты поддержки: 20`);
  console.log(`   - Уведомления: 50`);
  console.log(`   - Курсы: ${courses.length}`);
  console.log(`   - Уроки: ${courses.length * 5}`);
  console.log(`   - Выплаты: 20`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
