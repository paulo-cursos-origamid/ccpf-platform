-- ============================================================
-- Invoice installments
-- Preserva invoices e payments existentes.
-- ============================================================

-- 1. Cria o status das parcelas.
CREATE TYPE "InvoiceInstallmentStatus" AS ENUM (
  'PENDING',
  'PAID',
  'OVERDUE',
  'CANCELLED'
);

-- 2. Cria a tabela de parcelas.
CREATE TABLE "InvoiceInstallment" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "totalCount" INTEGER NOT NULL,
  "amount" DECIMAL NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "dueAt" TIMESTAMP(3) NOT NULL,
  "paidAt" TIMESTAMP(3),
  "status" "InvoiceInstallmentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InvoiceInstallment_pkey" PRIMARY KEY ("id")
);

-- 3. Adiciona o contador de parcelas à Invoice.
ALTER TABLE "Invoice"
ADD COLUMN "installmentCount" INTEGER NOT NULL DEFAULT 1;

-- 4. Adiciona a referência da parcela ao Payment.
--    Temporariamente nullable para permitir o backfill.
ALTER TABLE "Payment"
ADD COLUMN "installmentId" TEXT;

-- 5. Cada Invoice histórica vira uma InvoiceInstallment 1/1.
INSERT INTO "InvoiceInstallment" (
  "id",
  "invoiceId",
  "number",
  "totalCount",
  "amount",
  "currency",
  "dueAt",
  "paidAt",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  "id",
  1,
  1,
  "amount",
  "currency",
  "dueAt",
  "paidAt",
  CASE "status"
    WHEN 'PAID' THEN 'PAID'::"InvoiceInstallmentStatus"
    WHEN 'OVERDUE' THEN 'OVERDUE'::"InvoiceInstallmentStatus"
    WHEN 'CANCELLED' THEN 'CANCELLED'::"InvoiceInstallmentStatus"
    ELSE 'PENDING'::"InvoiceInstallmentStatus"
  END,
  "createdAt",
  "updatedAt"
FROM "Invoice";

-- 6. Atualiza o contador histórico.
UPDATE "Invoice"
SET "installmentCount" = 1;

-- 7. Relaciona cada Payment histórico à parcela correspondente.
UPDATE "Payment" p
SET "installmentId" = i."id"
FROM "InvoiceInstallment" i
WHERE i."invoiceId" = p."invoiceId";

-- 8. Todo Payment existente precisa possuir uma parcela.
ALTER TABLE "Payment"
ALTER COLUMN "installmentId" SET NOT NULL;

-- 9. Índices da nova estrutura.
CREATE UNIQUE INDEX "InvoiceInstallment_invoiceId_number_key"
ON "InvoiceInstallment"("invoiceId", "number");

CREATE INDEX "InvoiceInstallment_invoiceId_idx"
ON "InvoiceInstallment"("invoiceId");

CREATE INDEX "InvoiceInstallment_status_idx"
ON "InvoiceInstallment"("status");

CREATE INDEX "InvoiceInstallment_dueAt_idx"
ON "InvoiceInstallment"("dueAt");

CREATE INDEX "Payment_installmentId_idx"
ON "Payment"("installmentId");

-- 10. FK Invoice -> Installment.
ALTER TABLE "InvoiceInstallment"
ADD CONSTRAINT "InvoiceInstallment_invoiceId_fkey"
FOREIGN KEY ("invoiceId")
REFERENCES "Invoice"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- 11. FK Payment -> Installment.
ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_installmentId_fkey"
FOREIGN KEY ("installmentId")
REFERENCES "InvoiceInstallment"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- 12. Remove a antiga relação Payment -> Invoice.
ALTER TABLE "Payment"
DROP CONSTRAINT IF EXISTS "Payment_invoiceId_fkey";

DROP INDEX IF EXISTS "Payment_invoiceId_idx";

ALTER TABLE "Payment"
DROP COLUMN "invoiceId";
