-- Remove campos legados de preço que pertenciam ao modelo Plan.
-- Os preços comerciais agora são representados exclusivamente por PlanPrice.

ALTER TABLE "Plan"
DROP COLUMN "price",
DROP COLUMN "currency",
DROP COLUMN "billingInterval";

-- MONTHLY deixou de fazer parte das modalidades comerciais.
-- O enum será mantido sem MONTHLY apenas se nenhuma linha existente
-- utilizar esse valor.
