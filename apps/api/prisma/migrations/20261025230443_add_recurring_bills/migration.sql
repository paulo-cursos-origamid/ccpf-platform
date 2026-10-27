-- CreateEnum
CREATE TYPE "RecurringBillFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "RecurringBillOccurrenceStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED');

-- CreateTable
CREATE TABLE "RecurringBill" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subCategoryId" TEXT,
    "title" TEXT NOT NULL,
    "expectedAmount" DECIMAL(12,2),
    "frequency" "RecurringBillFrequency" NOT NULL DEFAULT 'MONTHLY',
    "dueDay" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringBillOccurrence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recurringBillId" TEXT NOT NULL,
    "transactionId" TEXT,
    "referenceMonth" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "expectedAmount" DECIMAL(12,2),
    "paidAmount" DECIMAL(12,2),
    "paidAt" TIMESTAMP(3),
    "status" "RecurringBillOccurrenceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringBillOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringBill_tenantId_accountId_idx" ON "RecurringBill"("tenantId", "accountId");

-- CreateIndex
CREATE INDEX "RecurringBill_tenantId_isActive_idx" ON "RecurringBill"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "RecurringBill_tenantId_dueDay_idx" ON "RecurringBill"("tenantId", "dueDay");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringBill_id_tenantId_key" ON "RecurringBill"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringBillOccurrence_transactionId_key" ON "RecurringBillOccurrence"("transactionId");

-- CreateIndex
CREATE INDEX "RecurringBillOccurrence_tenantId_dueDate_status_idx" ON "RecurringBillOccurrence"("tenantId", "dueDate", "status");

-- CreateIndex
CREATE INDEX "RecurringBillOccurrence_tenantId_recurringBillId_idx" ON "RecurringBillOccurrence"("tenantId", "recurringBillId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringBillOccurrence_recurringBillId_referenceMonth_key" ON "RecurringBillOccurrence"("recurringBillId", "referenceMonth");

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_accountId_tenantId_fkey" FOREIGN KEY ("accountId", "tenantId") REFERENCES "Account"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_categoryId_tenantId_fkey" FOREIGN KEY ("categoryId", "tenantId") REFERENCES "Category"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBill" ADD CONSTRAINT "RecurringBill_subCategoryId_categoryId_fkey" FOREIGN KEY ("subCategoryId", "categoryId") REFERENCES "SubCategory"("id", "categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBillOccurrence" ADD CONSTRAINT "RecurringBillOccurrence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBillOccurrence" ADD CONSTRAINT "RecurringBillOccurrence_recurringBillId_tenantId_fkey" FOREIGN KEY ("recurringBillId", "tenantId") REFERENCES "RecurringBill"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringBillOccurrence" ADD CONSTRAINT "RecurringBillOccurrence_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
