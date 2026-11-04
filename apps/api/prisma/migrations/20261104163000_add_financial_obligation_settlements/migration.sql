ALTER TYPE "FinancialObligationStatus"
ADD VALUE 'PARTIALLY_SETTLED';

CREATE TABLE "FinancialObligationSettlement" (
    "id" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "principalAmount" DECIMAL(12,2) NOT NULL,
    "interestAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "feeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "settledAmount" DECIMAL(12,2) NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialObligationSettlement_pkey"
      PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinancialObligationSettlement_transactionId_key"
ON "FinancialObligationSettlement"("transactionId");

CREATE INDEX "FinancialObligationSettlement_tenantId_obligationId_settledAt_idx"
ON "FinancialObligationSettlement"("tenantId", "obligationId", "settledAt");

CREATE INDEX "FinancialObligationSettlement_tenantId_userId_idx"
ON "FinancialObligationSettlement"("tenantId", "userId");

ALTER TABLE "FinancialObligationSettlement"
ADD CONSTRAINT "FinancialObligationSettlement_obligationId_tenantId_fkey"
FOREIGN KEY ("obligationId", "tenantId")
REFERENCES "FinancialObligation"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialObligationSettlement"
ADD CONSTRAINT "FinancialObligationSettlement_tenantId_fkey"
FOREIGN KEY ("tenantId")
REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialObligationSettlement"
ADD CONSTRAINT "FinancialObligationSettlement_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FinancialObligationSettlement"
ADD CONSTRAINT "FinancialObligationSettlement_transactionId_fkey"
FOREIGN KEY ("transactionId")
REFERENCES "Transaction"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migra as liquidações antigas sem criar novos movimentos financeiros.
INSERT INTO "FinancialObligationSettlement" (
    "id",
    "obligationId",
    "tenantId",
    "userId",
    "transactionId",
    "principalAmount",
    "interestAmount",
    "feeAmount",
    "discountAmount",
    "settledAmount",
    "settledAt",
    "createdAt"
)
SELECT
    'legacy-' || fo."id",
    fo."id",
    fo."tenantId",
    fo."userId",
    fo."transactionId",
    fo."amount",
    0,
    0,
    0,
    fo."amount",
    COALESCE(fo."settledAt", fo."updatedAt"),
    fo."createdAt"
FROM "FinancialObligation" fo
WHERE fo."status" = 'SETTLED';
