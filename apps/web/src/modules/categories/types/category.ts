export type CategoryType = "INCOME" | "EXPENSE";

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  type: CategoryType;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  isVehicleCategory: boolean;
  parentId?: string | null;
  children?: Category[];
  subCategories?: SubCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
}

export interface SaveCategoryInput {
  name: string;
  type: CategoryType;
  description?: string;
  color?: string;
  icon?: string;
  isVehicleCategory?: boolean;
  parentId?: string | null;
}

export interface SaveSubCategoryInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}
