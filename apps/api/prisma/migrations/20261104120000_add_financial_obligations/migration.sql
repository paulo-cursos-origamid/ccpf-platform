CREATE TYPE "FinancialObligationType" AS ENUM ('PAYABLE', 'RECEIVABLE');
CREATE TYPE "FinancialObligationStatus" AS ENUM ('PENDING', 'SETTLED', 'CANCELED');

CREATE TABLE "FinancialObligation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subCategoryId" TEXT,
    "transactionId" TEXT,
    "type" "FinancialObligationType" NOT NULL,
    "status" "FinancialObligationStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "counterparty" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialObligation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinancialObligation_transactionId_key" ON "FinancialObligation"("transactionId");
CREATE UNIQUE INDEX "FinancialObligation_id_tenantId_key" ON "FinancialObligation"("id", "tenantId");
CREATE INDEX "FinancialObligation_tenantId_type_dueDate_idx" ON "FinancialObligation"("tenantId", "type", "dueDate");
CREATE INDEX "FinancialObligation_tenantId_status_dueDate_idx" ON "FinancialObligation"("tenantId", "status", "dueDate");
CREATE INDEX "FinancialObligation_tenantId_accountId_idx" ON "FinancialObligation"("tenantId", "accountId");

ALTER TABLE "FinancialObligation" ADD CONSTRAINT "FinancialObligation_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialObligation" ADD CONSTRAINT "FinancialObligation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialObligation" ADD CONSTRAINT "FinancialObligation_accountId_tenantId_fkey"
    FOREIGN KEY ("accountId", "tenantId") REFERENCES "Account"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialObligation" ADD CONSTRAINT "FinancialObligation_categoryId_tenantId_fkey"
    FOREIGN KEY ("categoryId", "tenantId") REFERENCES "Category"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialObligation" ADD CONSTRAINT "FinancialObligation_subCategoryId_categoryId_fkey"
    FOREIGN KEY ("subCategoryId", "categoryId") REFERENCES "SubCategory"("id", "categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialObligation" ADD CONSTRAINT "FinancialObligation_transactionId_fkey"
    FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;