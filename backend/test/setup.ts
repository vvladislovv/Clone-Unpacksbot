import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean up test data before running tests
  await prisma.user.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.product.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.deal.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.supportTicket.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.transaction.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
});

afterAll(async () => {
  // Clean up test data after running tests
  await prisma.user.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.product.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.deal.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.supportTicket.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  await prisma.transaction.deleteMany({
    where: { id: { startsWith: 'test-' } },
  });
  
  await prisma.$disconnect();
});
