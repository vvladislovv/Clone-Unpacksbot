const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSupportData() {
  try {
    console.log('🔍 Checking support data in database...\n');

    // Проверяем таблицу SupportTicket
    const supportTickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`📋 Support Tickets (${supportTickets.length} records):`);
    console.log('=' .repeat(80));
    
    supportTickets.forEach((ticket, index) => {
      console.log(`${index + 1}. ID: ${ticket.id}`);
      console.log(`   Subject: ${ticket.subject}`);
      console.log(`   Message: ${ticket.message.substring(0, 50)}...`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   Priority: ${ticket.priority}`);
      console.log(`   User: ${ticket.user.firstName} ${ticket.user.lastName} (${ticket.user.email})`);
      console.log(`   Created: ${ticket.createdAt.toISOString()}`);
      console.log('-'.repeat(80));
    });

    // Проверяем таблицу Message (чаты)
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log(`\n💬 Chat Messages (${messages.length} records):`);
    console.log('=' .repeat(80));
    
    messages.forEach((message, index) => {
      console.log(`${index + 1}. ID: ${message.id}`);
      console.log(`   Content: ${message.content}`);
      console.log(`   Type: ${message.type}`);
      console.log(`   Sender: ${message.sender.firstName} ${message.sender.lastName}`);
      console.log(`   Created: ${message.createdAt.toISOString()}`);
      console.log('-'.repeat(80));
    });

    // Статистика
    const totalSupportTickets = await prisma.supportTicket.count();
    const totalMessages = await prisma.message.count();
    const totalUsers = await prisma.user.count();

    console.log('\n📊 Database Statistics:');
    console.log('=' .repeat(40));
    console.log(`Total Support Tickets: ${totalSupportTickets}`);
    console.log(`Total Chat Messages: ${totalMessages}`);
    console.log(`Total Users: ${totalUsers}`);

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSupportData();
