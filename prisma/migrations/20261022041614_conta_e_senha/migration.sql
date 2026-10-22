-- AlterTable
ALTER TABLE "LoginAttempt" ADD COLUMN     "ip" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_createdAt_idx" ON "LoginAttempt"("ip", "createdAt");
