-- ============================================================
-- PLAN PRICE
-- ============================================================
-- O preço comercial deixou de pertencer diretamente a Plan.
-- Cada modalidade comercial é representada por PlanPrice.

CREATE TABLE "PlanPrice" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- BILLING INTERVAL
-- ============================================================
-- O banco herdou MONTHLY da primeira versão do billing.
-- Como não existem registros e o modelo atual usa
-- SEMESTERLY / YEARLY / LIFETIME, recriamos o enum alinhado
-- ao schema atual.

ALTER TYPE "BillingInterval" RENAME TO "BillingInterval_old";

CREATE TYPE "BillingInterval" AS ENUM (
    'SEMESTERLY',
    'YEARLY',
    'LIFETIME'
);

ALTER TABLE "PlanPrice"
ALTER COLUMN "interval" TYPE "BillingInterval"
USING "interval"::text::"BillingInterval";

DROP TYPE "BillingInterval_old";

-- ============================================================
-- PLAN PRICE — FOREIGN KEY / UNIQUE
-- ============================================================

ALTER TABLE "PlanPrice"
ADD CONSTRAINT "PlanPrice_planId_fkey"
FOREIGN KEY ("planId")
REFERENCES "Plan"("id")
ON UPDATE CASCADE
ON DELETE CASCADE;

CREATE UNIQUE INDEX "PlanPrice_planId_interval_key"
ON "PlanPrice"("planId", "interval");

-- ============================================================
-- SUBSCRIPTION — PLAN PRICE
-- ============================================================

ALTER TABLE "Subscription"
ADD COLUMN "planPriceId" TEXT,
ADD COLUMN "pendingPlanPriceId" TEXT;

CREATE INDEX "Subscription_planPriceId_idx"
ON "Subscription"("planPriceId");

CREATE INDEX "Subscription_pendingPlanPriceId_idx"
ON "Subscription"("pendingPlanPriceId");

ALTER TABLE "Subscription"
ADD CONSTRAINT "Subscription_planPriceId_fkey"
FOREIGN KEY ("planPriceId")
REFERENCES "PlanPrice"("id")
ON UPDATE CASCADE
ON DELETE SET NULL;

ALTER TABLE "Subscription"
ADD CONSTRAINT "Subscription_pendingPlanPriceId_fkey"
FOREIGN KEY ("pendingPlanPriceId")
REFERENCES "PlanPrice"("id")
ON UPDATE CASCADE
ON DELETE SET NULL;
