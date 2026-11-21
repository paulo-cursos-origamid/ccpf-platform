ALTER TYPE "FinancialPaymentMethod" ADD VALUE 'DEBIT_CARD';

ALTER TABLE "Transaction"
ADD COLUMN "paymentMethod" "FinancialPaymentMethod";
