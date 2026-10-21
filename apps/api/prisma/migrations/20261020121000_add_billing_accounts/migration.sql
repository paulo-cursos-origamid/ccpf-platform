-- Adiciona a conta comercial sem remover ou recriar dados existentes.

CREATE TABLE "BillingAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingAccount_ownerUserId_key"
    ON "BillingAccount"("ownerUserId");

CREATE INDEX "BillingAccount_ownerUserId_idx"
    ON "BillingAccount"("ownerUserId");

ALTER TABLE "Tenant"
    ADD COLUMN "billingAccountId" TEXT;

ALTER TABLE "Subscription"
    ADD COLUMN "billingAccountId" TEXT;

CREATE INDEX "Tenant_billingAccountId_idx"
    ON "Tenant"("billingAccountId");

CREATE INDEX "Subscription_billingAccountId_idx"
    ON "Subscription"("billingAccountId");

ALTER TABLE "BillingAccount"
    ADD CONSTRAINT "BillingAccount_ownerUserId_fkey"
    FOREIGN KEY ("ownerUserId")
    REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tenant"
    ADD CONSTRAINT "Tenant_billingAccountId_fkey"
    FOREIGN KEY ("billingAccountId")
    REFERENCES "BillingAccount"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Subscription"
    ADD CONSTRAINT "Subscription_billingAccountId_fkey"
    FOREIGN KEY ("billingAccountId")
    REFERENCES "BillingAccount"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
