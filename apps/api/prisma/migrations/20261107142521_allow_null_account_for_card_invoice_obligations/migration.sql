-- Somente obrigações originadas de faturas de cartão podem ficar sem conta de referência.
-- A conta efetiva será informada na liquidação, em FinancialObligationSettlement.
ALTER TABLE "FinancialObligation"
ALTER COLUMN "accountId" DROP NOT NULL;
