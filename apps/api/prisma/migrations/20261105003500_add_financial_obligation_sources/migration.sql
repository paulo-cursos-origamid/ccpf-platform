CREATE TYPE "FinancialObligationSourceType" AS ENUM (
  'MANUAL',
  'RECURRING_BILL_OCCURRENCE',
  'INSTALLMENT',
  'CREDIT_CARD_INVOICE'
);

ALTER TABLE "FinancialObligation"
  ADD COLUMN "sourceType" "FinancialObligationSourceType" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "sourceId" TEXT;

CREATE UNIQUE INDEX "FinancialObligation_tenantId_sourceType_sourceId_key"
  ON "FinancialObligation"("tenantId", "sourceType", "sourceId");

ALTER TABLE "FinancialObligation"
  ADD CONSTRAINT "FinancialObligation_source_consistency_check"
  CHECK (
    ("sourceType" = 'MANUAL' AND "sourceId" IS NULL)
    OR (
      "sourceType" <> 'MANUAL'
      AND "sourceId" IS NOT NULL
      AND btrim("sourceId") <> ''
    )
  );
