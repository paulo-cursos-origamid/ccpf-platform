-- AlterTable
ALTER TABLE "Installment" ADD COLUMN     "transactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Installment_transactionId_key" ON "Installment"("transactionId");

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

