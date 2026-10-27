export type InstallmentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELED";

export interface Installment {
  id: string;
  installmentNumber: number;
  amount: number | string;
  dueDate: string;
  status: InstallmentStatus;
  paidAt: string | null;
}

export interface InstallmentPlan {
  id: string;
  title: string;
  totalAmount: number | string;
  purchaseDate: string;
  installmentCount: number;
  firstDueDate: string;
  accountId: string;
  categoryId: string;
  subCategoryId?: string | null;
  description?: string | null;
  installments: Installment[];
}

export interface CreateInstallmentPlanInput {
  title: string;
  totalAmount: string;
  accountId: string;
  categoryId: string;
  subCategoryId?: string;
  purchaseDate: string;
  installmentCount: number;
  firstDueDate: string;
  description?: string;
}
