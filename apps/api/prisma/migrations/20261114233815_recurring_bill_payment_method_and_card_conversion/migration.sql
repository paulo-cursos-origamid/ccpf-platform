-- CreateEnum
CREATE TYPE "FinancialPaymentMethod" AS ENUM ('CASH', 'PIX', 'BANK_SLIP', 'CREDIT_CARD');

-- AlterEnum
ALTER TYPE "FinancialObligationStatus" ADD VALUE 'CONVERTED';

-- AlterEnum
ALTER TYPE "RecurringBillOccurrenceStatus" ADD VALUE 'CHARGED_TO_CARD';

-- AlterTable
ALTER TABLE "RecurringBill" ALTER COLUMN "accountId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RecurringBillOccurrence" ADD COLUMN     "creditCardPurchaseId" TEXT,
ADD COLUMN     "paymentMethod" "FinancialPaymentMethod";

-- CreateIndex
CREATE UNIQUE INDEX "RecurringBillOccurrence_creditCardPurchaseId_key" ON "RecurringBillOccurrence"("creditCardPurchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringBillOccurrence_creditCardPurchaseId_tenantId_key" ON "RecurringBillOccurrence"("creditCardPurchaseId", "tenantId");

-- AddForeignKey
ALTER TABLE "RecurringBillOccurrence" ADD CONSTRAINT "RecurringBillOccurrence_creditCardPurchaseId_tenantId_fkey" FOREIGN KEY ("creditCardPurchaseId", "tenantId") REFERENCES "CreditCardPurchase"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

