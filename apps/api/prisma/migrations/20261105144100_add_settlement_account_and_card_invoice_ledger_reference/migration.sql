-- Permite identificar lançamentos originados pelo pagamento de faturas de cartão.
ALTER TYPE "LedgerReferenceType" ADD VALUE 'CREDIT_CARD_INVOICE_PAYMENT';

-- Cada liquidação registra a conta que efetivamente realizou o pagamento.
ALTER TABLE "FinancialObligationSettlement"
ADD COLUMN "accountId" TEXT;

-- Liquidações existentes utilizam a conta de referência da obrigação.
UPDATE "FinancialObligationSettlement" AS settlement
SET "accountId" = obligation."accountId"
FROM "FinancialObligation" AS obligation
WHERE obligation."id" = settlement."obligationId"
  AND obligation."tenantId" = settlement."tenantId";

ALTER TABLE "FinancialObligationSettlement"
ALTER COLUMN "accountId" SET NOT NULL;

CREATE INDEX "FinancialObligationSettlement_tenantId_accountId_settledAt_idx"
ON "FinancialObligationSettlement"("tenantId", "accountId", "settledAt");

ALTER TABLE "FinancialObligationSettlement"
ADD CONSTRAINT "FinancialObligationSettlement_accountId_tenantId_fkey"
FOREIGN KEY ("accountId", "tenantId")
REFERENCES "Account"("id", "tenantId")
ON DELETE RESTRICT
ON UPDATE CASCADE;
