-- Mantém CategoryDomainLink compatível com os indicadores booleanos.
-- Insere apenas vínculos ausentes; não remove nem duplica registros.

INSERT INTO "CategoryDomainLink" ("categoryId", "domain")
SELECT "id", 'DOMESTIC'::"CategoryDomain"
FROM "Category"
WHERE "isDomesticCategory" = TRUE
ON CONFLICT ("categoryId", "domain") DO NOTHING;

INSERT INTO "CategoryDomainLink" ("categoryId", "domain")
SELECT "id", 'HEALTH'::"CategoryDomain"
FROM "Category"
WHERE "isHealthCategory" = TRUE
ON CONFLICT ("categoryId", "domain") DO NOTHING;

INSERT INTO "CategoryDomainLink" ("categoryId", "domain")
SELECT "id", 'TRANSPORT'::"CategoryDomain"
FROM "Category"
WHERE "isTransportCategory" = TRUE
ON CONFLICT ("categoryId", "domain") DO NOTHING;

INSERT INTO "CategoryDomainLink" ("categoryId", "domain")
SELECT "id", 'VEHICLES'::"CategoryDomain"
FROM "Category"
WHERE "isVehicleCategory" = TRUE
ON CONFLICT ("categoryId", "domain") DO NOTHING;

INSERT INTO "CategoryDomainLink" ("categoryId", "domain")
SELECT "id", 'INVESTMENTS'::"CategoryDomain"
FROM "Category"
WHERE "isInvestmentCategory" = TRUE
ON CONFLICT ("categoryId", "domain") DO NOTHING;

INSERT INTO "CategoryDomainLink" ("categoryId", "domain")
SELECT "id", 'OTHER'::"CategoryDomain"
FROM "Category"
WHERE "isOtherCategory" = TRUE
ON CONFLICT ("categoryId", "domain") DO NOTHING;
