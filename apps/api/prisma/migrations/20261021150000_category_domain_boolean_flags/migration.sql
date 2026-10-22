-- Adiciona indicadores booleanos de domínio às categorias.
-- Os vínculos existentes são preservados; os dados são copiados para os novos campos.
ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "isDomesticCategory" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "isHealthCategory" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "isTransportCategory" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "isInvestmentCategory" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "isOtherCategory" BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF to_regclass('"CategoryDomainLink"') IS NOT NULL THEN
    UPDATE "Category" AS c
    SET
      "isDomesticCategory" = EXISTS (
        SELECT 1 FROM "CategoryDomainLink" d
        WHERE d."categoryId" = c."id" AND d."domain"::text = 'DOMESTIC'
      ),
      "isHealthCategory" = EXISTS (
        SELECT 1 FROM "CategoryDomainLink" d
        WHERE d."categoryId" = c."id" AND d."domain"::text = 'HEALTH'
      ),
      "isTransportCategory" = EXISTS (
        SELECT 1 FROM "CategoryDomainLink" d
        WHERE d."categoryId" = c."id" AND d."domain"::text = 'TRANSPORT'
      ),
      "isVehicleCategory" = (
        c."isVehicleCategory" OR EXISTS (
          SELECT 1 FROM "CategoryDomainLink" d
          WHERE d."categoryId" = c."id" AND d."domain"::text = 'VEHICLES'
        )
      ),
      "isInvestmentCategory" = EXISTS (
        SELECT 1 FROM "CategoryDomainLink" d
        WHERE d."categoryId" = c."id" AND d."domain"::text = 'INVESTMENTS'
      ),
      "isOtherCategory" = EXISTS (
        SELECT 1 FROM "CategoryDomainLink" d
        WHERE d."categoryId" = c."id" AND d."domain"::text = 'OTHER'
      );
  ELSE
    -- Compatibilidade para bancos sem a tabela de vínculos.
    UPDATE "Category"
    SET "isVehicleCategory" = COALESCE("isVehicleCategory", FALSE);
  END IF;
END $$;
