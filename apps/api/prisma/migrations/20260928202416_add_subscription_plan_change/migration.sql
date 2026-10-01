-- CreateEnum
CREATE TYPE "SubscriptionPlanChangeType" AS ENUM ('UPGRADE', 'DOWNGRADE');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "pendingPlanChangeType" "SubscriptionPlanChangeType",
ADD COLUMN     "pendingPlanEffectiveAt" TIMESTAMP(3),
ADD COLUMN     "pendingPlanId" TEXT,
ADD COLUMN     "pendingPlanInvoiceId" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_pendingPlanId_idx" ON "Subscription"("pendingPlanId");

-- CreateIndex
CREATE INDEX "Subscription_pendingPlanEffectiveAt_idx" ON "Subscription"("pendingPlanEffectiveAt");

-- CreateIndex
CREATE INDEX "Subscription_pendingPlanInvoiceId_idx" ON "Subscription"("pendingPlanInvoiceId");
