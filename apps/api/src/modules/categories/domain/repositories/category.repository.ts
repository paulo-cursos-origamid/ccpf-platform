import { Category, CategoryDomain, CategoryType, Prisma, SubCategory } from '@prisma/client';

export type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: {
    children: true;
    subCategories: true;
    domains: true;
  };
}>;

export interface CategoryData {
  name: string;
  slug: string;
  type: CategoryType;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isVehicleCategory?: boolean;
  parentId?: string | null;
  domains?: CategoryDomain[];
}

export interface SubCategoryData {
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
}

export abstract class CategoryRepository {
  abstract list(
    tenantId: string,
    type?: CategoryType,
  ): Promise<CategoryWithRelations[]>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<CategoryWithRelations | null>;

  abstract create(tenantId: string, data: CategoryData): Promise<Category>;

  abstract update(
    tenantId: string,
    id: string,
    data: Partial<CategoryData>,
  ): Promise<CategoryWithRelations>;

  abstract softDelete(tenantId: string, id: string): Promise<void>;

  abstract listSubCategories(
    tenantId: string,
    categoryId: string,
  ): Promise<SubCategory[]>;

  abstract findSubCategory(
    tenantId: string,
    categoryId: string,
    subCategoryId: string,
  ): Promise<SubCategory | null>;

  abstract createSubCategory(
    tenantId: string,
    categoryId: string,
    data: SubCategoryData,
  ): Promise<SubCategory>;

  abstract updateSubCategory(
    tenantId: string,
    categoryId: string,
    subCategoryId: string,
    data: Partial<SubCategoryData>,
  ): Promise<SubCategory>;

  abstract softDeleteSubCategory(
    tenantId: string,
    categoryId: string,
    subCategoryId: string,
  ): Promise<void>;
}
