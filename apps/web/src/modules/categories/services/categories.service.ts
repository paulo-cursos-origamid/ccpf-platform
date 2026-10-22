import { api } from "@/lib/api/client";
import type {
  Category,
  CategoryType,
  SubCategory,
  SaveCategoryInput,
  SaveSubCategoryInput,
} from "../types";

class CategoriesService {
  list(type?: CategoryType) {
    const query = type ? `?type=${type}` : "";
    return api.get<Category[]>(`/categories${query}`);
  }

  get(id: string) {
    return api.get<Category>(`/categories/${id}`);
  }

  create(data: SaveCategoryInput) {
    return api.post<Category>("/categories", data);
  }

  update(id: string, data: Partial<SaveCategoryInput>) {
    return api.patch<Category>(`/categories/${id}`, data);
  }

  delete(id: string) {
    return api.delete<void>(`/categories/${id}`);
  }

  listSubCategories(categoryId: string) {
    return api.get<SubCategory[]>(`/categories/${categoryId}/subcategories`);
  }

  createSubCategory(categoryId: string, data: SaveSubCategoryInput) {
    return api.post<SubCategory>(
      `/categories/${categoryId}/subcategories`,
      data,
    );
  }

  updateSubCategory(
    categoryId: string,
    subCategoryId: string,
    data: Partial<SaveSubCategoryInput>,
  ) {
    return api.patch<SubCategory>(
      `/categories/${categoryId}/subcategories/${subCategoryId}`,
      data,
    );
  }

  deleteSubCategory(categoryId: string, subCategoryId: string) {
    return api.delete<void>(
      `/categories/${categoryId}/subcategories/${subCategoryId}`,
    );
  }
}

export const categoriesService = new CategoriesService();
