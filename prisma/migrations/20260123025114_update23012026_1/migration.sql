/*
  Warnings:

  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('ORDER_SUCCESS', 'ORDER_FAILED', 'CART_ABANDONED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "abandonedEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "checkedOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "email" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PAID';

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "cartId" TEXT,
    "type" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "uniqueKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_uniqueKey_key" ON "EmailLog"("uniqueKey");

-- CreateIndex
CREATE INDEX "EmailLog_orderId_idx" ON "EmailLog"("orderId");

-- CreateIndex
CREATE INDEX "EmailLog_cartId_idx" ON "EmailLog"("cartId");

-- CreateIndex
CREATE INDEX "EmailLog_userId_idx" ON "EmailLog"("userId");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
