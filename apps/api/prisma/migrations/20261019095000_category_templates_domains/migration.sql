-- Domínios funcionais disponíveis para categorização.
CREATE TYPE "CategoryDomain" AS ENUM (
  'DOMESTIC',
  'HEALTH',
  'TRANSPORT',
  'VEHICLES',
  'INVESTMENTS',
  'OTHER'
);

-- Catálogo global de templates. Os dados operacionais continuam por Tenant.
CREATE TABLE "CategoryTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "CategoryType" NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "icon" TEXT,
  "isVehicleCategory" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CategoryTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubCategoryTemplate" (
  "id" TEXT NOT NULL,
  "categoryTemplateId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "icon" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubCategoryTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CategoryTemplateDomain" (
  "templateId" TEXT NOT NULL,
  "domain" "CategoryDomain" NOT NULL,
  CONSTRAINT "CategoryTemplateDomain_pkey" PRIMARY KEY ("templateId", "domain")
);

CREATE TABLE "CategoryDomainLink" (
  "categoryId" TEXT NOT NULL,
  "domain" "CategoryDomain" NOT NULL,
  CONSTRAINT "CategoryDomainLink_pkey" PRIMARY KEY ("categoryId", "domain")
);

ALTER TABLE "Category" ADD COLUMN "templateId" TEXT;
ALTER TABLE "SubCategory" ADD COLUMN "templateId" TEXT;

CREATE UNIQUE INDEX "CategoryTemplate_slug_key"
  ON "CategoryTemplate"("slug");

CREATE INDEX "CategoryTemplate_type_idx"
  ON "CategoryTemplate"("type");

CREATE UNIQUE INDEX "SubCategoryTemplate_categoryTemplateId_slug_key"
  ON "SubCategoryTemplate"("categoryTemplateId", "slug");

CREATE INDEX "SubCategoryTemplate_categoryTemplateId_idx"
  ON "SubCategoryTemplate"("categoryTemplateId");

CREATE INDEX "CategoryTemplateDomain_domain_idx"
  ON "CategoryTemplateDomain"("domain");

CREATE INDEX "CategoryDomainLink_domain_idx"
  ON "CategoryDomainLink"("domain");

CREATE INDEX "Category_templateId_idx"
  ON "Category"("templateId");

CREATE INDEX "SubCategory_templateId_idx"
  ON "SubCategory"("templateId");

ALTER TABLE "SubCategoryTemplate"
  ADD CONSTRAINT "SubCategoryTemplate_categoryTemplateId_fkey"
  FOREIGN KEY ("categoryTemplateId") REFERENCES "CategoryTemplate"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CategoryTemplateDomain"
  ADD CONSTRAINT "CategoryTemplateDomain_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "CategoryTemplate"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CategoryDomainLink"
  ADD CONSTRAINT "CategoryDomainLink_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "CategoryTemplate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SubCategory"
  ADD CONSTRAINT "SubCategory_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "SubCategoryTemplate"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
