-- AlterTable
ALTER TABLE "users" ADD COLUMN     "telegramUsername" TEXT,
ADD COLUMN     "verificationCompletedAt" TIMESTAMP(3),
ADD COLUMN     "verificationStartedAt" TIMESTAMP(3),
ADD COLUMN     "verificationStatus" TEXT DEFAULT 'NOT_STARTED';
