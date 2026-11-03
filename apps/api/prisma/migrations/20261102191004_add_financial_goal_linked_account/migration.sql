-- AlterTable
ALTER TABLE "FinancialGoal" ADD COLUMN     "linkedAccountId" TEXT;

-- CreateIndex
CREATE INDEX "FinancialGoal_tenantId_linkedAccountId_idx" ON "FinancialGoal"("tenantId", "linkedAccountId");

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_linkedAccountId_tenantId_fkey" FOREIGN KEY ("linkedAccountId", "tenantId") REFERENCES "Account"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
