const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestAffiliateData() {
  try {
    console.log('🤝 Creating test affiliate data...');

    // Найдем первого пользователя
    const mainUser = await prisma.user.findFirst();
    if (!mainUser) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`✅ Found main user: ${mainUser.username} (${mainUser.id})`);

    // Создадим несколько рефералов
    const timestamp = Date.now();
    const referrals = [
      {
        username: `referral1_${timestamp}`,
        email: `referral1_${timestamp}@example.com`,
        firstName: 'Анна',
        lastName: 'Смирнова',
        referredById: mainUser.id,
        isActive: true,
        isVerified: true,
        balance: 1000,
      },
      {
        username: `referral2_${timestamp}`,
        email: `referral2_${timestamp}@example.com`,
        firstName: 'Михаил',
        lastName: 'Петров',
        referredById: mainUser.id,
        isActive: true,
        isVerified: true,
        balance: 2500,
      },
      {
        username: `referral3_${timestamp}`,
        email: `referral3_${timestamp}@example.com`,
        firstName: 'Елена',
        lastName: 'Козлова',
        referredById: mainUser.id,
        isActive: false,
        isVerified: false,
        balance: 0,
      }
    ];

    // Удалим старых рефералов
    await prisma.user.deleteMany({
      where: { referredById: mainUser.id }
    });

    // Создадим новых рефералов
    for (const referralData of referrals) {
      await prisma.user.create({
        data: referralData
      });
    }

    console.log(`✅ Created ${referrals.length} referrals`);

    // Создадим реферальные транзакции
    const referralTransactions = [
      {
        userId: mainUser.id,
        type: 'REFERRAL',
        amount: 500,
        status: 'COMPLETED',
        description: 'Реферальная комиссия от Анны Смирновой',
        metadata: { referralId: 'referral1', commissionRate: 0.05 }
      },
      {
        userId: mainUser.id,
        type: 'REFERRAL',
        amount: 750,
        status: 'COMPLETED',
        description: 'Реферальная комиссия от Михаила Петрова',
        metadata: { referralId: 'referral2', commissionRate: 0.05 }
      },
      {
        userId: mainUser.id,
        type: 'REFERRAL',
        amount: 300,
        status: 'PENDING',
        description: 'Реферальная комиссия от Елены Козловой',
        metadata: { referralId: 'referral3', commissionRate: 0.05 }
      }
    ];

    // Удалим старые реферальные транзакции
    await prisma.transaction.deleteMany({
      where: { 
        userId: mainUser.id,
        type: 'REFERRAL'
      }
    });

    // Создадим новые транзакции
    for (const transactionData of referralTransactions) {
      await prisma.transaction.create({
        data: transactionData
      });
    }

    console.log(`✅ Created ${referralTransactions.length} referral transactions`);

    // Покажем итоговую статистику
    const stats = await prisma.user.aggregate({
      where: { referredById: mainUser.id },
      _count: true
    });

    const activeReferrals = await prisma.user.count({
      where: { 
        referredById: mainUser.id,
        isActive: true
      }
    });

    const totalCommissions = await prisma.transaction.aggregate({
      where: {
        userId: mainUser.id,
        type: 'REFERRAL',
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    });

    console.log('\n📊 Affiliate Statistics:');
    console.log(`Total referrals: ${stats._count}`);
    console.log(`Active referrals: ${activeReferrals}`);
    console.log(`Total commissions: ₽${Number(totalCommissions._sum.amount || 0)}`);
    console.log(`Referral code: ${mainUser.referralCode}`);

  } catch (error) {
    console.error('❌ Error creating test affiliate data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAffiliateData();
