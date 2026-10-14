-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_pendingPlanPriceId_fkey";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "billingDay" INTEGER,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "pendingBillingDay" INTEGER;

-- CreateIndex
CREATE INDEX "PlanPrice_planId_idx" ON "PlanPrice"("planId");

-- CreateIndex
CREATE INDEX "PlanPrice_interval_idx" ON "PlanPrice"("interval");

-- CreateIndex
CREATE INDEX "PlanPrice_isActive_idx" ON "PlanPrice"("isActive");

-- CreateIndex
CREATE INDEX "Subscription_billingDay_idx" ON "Subscription"("billingDay");

-- CreateIndex
CREATE INDEX "Subscription_pendingBillingDay_idx" ON "Subscription"("pendingBillingDay");

-- CreateIndex
CREATE INDEX "Subscription_nextBillingDate_idx" ON "Subscription"("nextBillingDate");
