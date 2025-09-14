/*
  Warnings:

  - You are about to drop the column `telegramUsername` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCompletedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStartedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "telegramUsername",
DROP COLUMN "verificationCompletedAt",
DROP COLUMN "verificationStartedAt",
DROP COLUMN "verificationStatus";
