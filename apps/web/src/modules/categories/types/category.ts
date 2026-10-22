export type CategoryType = "INCOME" | "EXPENSE";

export type CategoryDomain =
  | "DOMESTIC"
  | "HEALTH"
  | "TRANSPORT"
  | "VEHICLES"
  | "INVESTMENTS"
  | "OTHER";

export interface CategoryDomainLink {
  categoryId: string;
  domain: CategoryDomain;
}

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
  isDomesticCategory: boolean;
  isHealthCategory: boolean;
  isTransportCategory: boolean;
  isInvestmentCategory: boolean;
  isOtherCategory: boolean;
  domains?: CategoryDomainLink[];
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
  isDomesticCategory?: boolean;
  isHealthCategory?: boolean;
  isTransportCategory?: boolean;
  isInvestmentCategory?: boolean;
  isOtherCategory?: boolean;
  domains?: CategoryDomain[];
  parentId?: string | null;
}

export interface SaveSubCategoryInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}
