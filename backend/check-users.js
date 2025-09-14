const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Проверяем пользователей в базе данных...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Найдено пользователей: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username || 'N/A'} (${user.email || 'N/A'}) - ${user.role} - ${user.isActive ? 'Активен' : 'Неактивен'}`);
    });
    
    // Ищем админа
    const admin = users.find(u => u.role === 'ADMIN');
    if (admin) {
      console.log(`\n✅ Админ найден: ${admin.username} (${admin.email})`);
    } else {
      console.log('\n❌ Админ не найден');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
