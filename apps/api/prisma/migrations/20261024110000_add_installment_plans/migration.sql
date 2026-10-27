-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELED');

-- CreateTable
CREATE TABLE "InstallmentPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subCategoryId" TEXT,
    "title" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "installmentCount" INTEGER NOT NULL,
    "firstDueDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "installmentPlanId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstallmentPlan_tenantId_purchaseDate_idx" ON "InstallmentPlan"("tenantId", "purchaseDate");

-- CreateIndex
CREATE INDEX "InstallmentPlan_tenantId_accountId_idx" ON "InstallmentPlan"("tenantId", "accountId");

-- CreateIndex
CREATE INDEX "InstallmentPlan_tenantId_deletedAt_idx" ON "InstallmentPlan"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstallmentPlan_id_tenantId_key" ON "InstallmentPlan"("id", "tenantId");

-- CreateIndex
CREATE INDEX "Installment_tenantId_dueDate_status_idx" ON "Installment"("tenantId", "dueDate", "status");

-- CreateIndex
CREATE INDEX "Installment_tenantId_installmentPlanId_idx" ON "Installment"("tenantId", "installmentPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_installmentPlanId_installmentNumber_key" ON "Installment"("installmentPlanId", "installmentNumber");

-- AddForeignKey
ALTER TABLE "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_accountId_tenantId_fkey" FOREIGN KEY ("accountId", "tenantId") REFERENCES "Account"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_categoryId_tenantId_fkey" FOREIGN KEY ("categoryId", "tenantId") REFERENCES "Category"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallmentPlan" ADD CONSTRAINT "InstallmentPlan_subCategoryId_categoryId_fkey" FOREIGN KEY ("subCategoryId", "categoryId") REFERENCES "SubCategory"("id", "categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_installmentPlanId_tenantId_fkey" FOREIGN KEY ("installmentPlanId", "tenantId") REFERENCES "InstallmentPlan"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

