-- Faturas de cartão podem gerar obrigações sem categoria.
-- Obrigações comuns continuam exigindo categoria pelas regras do domínio.
ALTER TABLE "FinancialObligation"
ALTER COLUMN "categoryId" DROP NOT NULL;
