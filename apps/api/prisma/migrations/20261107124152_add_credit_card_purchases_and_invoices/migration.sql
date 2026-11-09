-- CreateEnum
CREATE TYPE "CreditCardInvoiceStatus" AS ENUM ('OPEN', 'CLOSED', 'PAID');

-- CreateTable
CREATE TABLE "CreditCardPurchase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subCategoryId" TEXT,
    "title" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "installmentCount" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCardPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditCardInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "creditCardId" TEXT NOT NULL,
    "referenceMonth" TIMESTAMP(3) NOT NULL,
    "closingDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "CreditCardInvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCardInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditCardInstallment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditCardInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditCardPurchase_tenantId_creditCardId_purchaseDate_idx" ON "CreditCardPurchase"("tenantId", "creditCardId", "purchaseDate");

-- CreateIndex
CREATE INDEX "CreditCardPurchase_tenantId_categoryId_purchaseDate_idx" ON "CreditCardPurchase"("tenantId", "categoryId", "purchaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "CreditCardPurchase_id_tenantId_key" ON "CreditCardPurchase"("id", "tenantId");

-- CreateIndex
CREATE INDEX "CreditCardInvoice_tenantId_status_dueDate_idx" ON "CreditCardInvoice"("tenantId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "CreditCardInvoice_id_tenantId_key" ON "CreditCardInvoice"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditCardInvoice_tenantId_creditCardId_referenceMonth_key" ON "CreditCardInvoice"("tenantId", "creditCardId", "referenceMonth");

-- CreateIndex
CREATE INDEX "CreditCardInstallment_tenantId_invoiceId_dueDate_idx" ON "CreditCardInstallment"("tenantId", "invoiceId", "dueDate");

-- CreateIndex
CREATE INDEX "CreditCardInstallment_tenantId_purchaseId_idx" ON "CreditCardInstallment"("tenantId", "purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditCardInstallment_tenantId_purchaseId_installmentNumber_key" ON "CreditCardInstallment"("tenantId", "purchaseId", "installmentNumber");

-- AddForeignKey
ALTER TABLE "CreditCardPurchase" ADD CONSTRAINT "CreditCardPurchase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardPurchase" ADD CONSTRAINT "CreditCardPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardPurchase" ADD CONSTRAINT "CreditCardPurchase_creditCardId_tenantId_fkey" FOREIGN KEY ("creditCardId", "tenantId") REFERENCES "CreditCard"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardPurchase" ADD CONSTRAINT "CreditCardPurchase_categoryId_tenantId_fkey" FOREIGN KEY ("categoryId", "tenantId") REFERENCES "Category"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardPurchase" ADD CONSTRAINT "CreditCardPurchase_subCategoryId_categoryId_fkey" FOREIGN KEY ("subCategoryId", "categoryId") REFERENCES "SubCategory"("id", "categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardInvoice" ADD CONSTRAINT "CreditCardInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardInvoice" ADD CONSTRAINT "CreditCardInvoice_creditCardId_tenantId_fkey" FOREIGN KEY ("creditCardId", "tenantId") REFERENCES "CreditCard"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardInstallment" ADD CONSTRAINT "CreditCardInstallment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardInstallment" ADD CONSTRAINT "CreditCardInstallment_purchaseId_tenantId_fkey" FOREIGN KEY ("purchaseId", "tenantId") REFERENCES "CreditCardPurchase"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardInstallment" ADD CONSTRAINT "CreditCardInstallment_invoiceId_tenantId_fkey" FOREIGN KEY ("invoiceId", "tenantId") REFERENCES "CreditCardInvoice"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
