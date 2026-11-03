/*
  Warnings:

  - A unique constraint covering the columns `[id,tenantId]` on the table `Transfer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "FinancialGoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "financialGoalId" TEXT;

-- CreateTable
CREATE TABLE "FinancialGoal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DECIMAL(12,2) NOT NULL,
    "targetDate" TIMESTAMP(3),
    "status" "FinancialGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FinancialGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialGoalContribution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialGoalContribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialGoal_tenantId_status_idx" ON "FinancialGoal"("tenantId", "status");

-- CreateIndex
CREATE INDEX "FinancialGoal_tenantId_userId_idx" ON "FinancialGoal"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "FinancialGoal_tenantId_deletedAt_idx" ON "FinancialGoal"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialGoal_id_tenantId_key" ON "FinancialGoal"("id", "tenantId");

-- CreateIndex
CREATE INDEX "FinancialGoalContribution_tenantId_goalId_deletedAt_idx" ON "FinancialGoalContribution"("tenantId", "goalId", "deletedAt");

-- CreateIndex
CREATE INDEX "FinancialGoalContribution_tenantId_userId_idx" ON "FinancialGoalContribution"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "FinancialGoalContribution_tenantId_date_idx" ON "FinancialGoalContribution"("tenantId", "date");

-- CreateIndex
CREATE INDEX "Transfer_tenantId_financialGoalId_deletedAt_idx" ON "Transfer"("tenantId", "financialGoalId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_id_tenantId_key" ON "Transfer"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_financialGoalId_tenantId_fkey" FOREIGN KEY ("financialGoalId", "tenantId") REFERENCES "FinancialGoal"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoalContribution" ADD CONSTRAINT "FinancialGoalContribution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoalContribution" ADD CONSTRAINT "FinancialGoalContribution_goalId_tenantId_fkey" FOREIGN KEY ("goalId", "tenantId") REFERENCES "FinancialGoal"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoalContribution" ADD CONSTRAINT "FinancialGoalContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
