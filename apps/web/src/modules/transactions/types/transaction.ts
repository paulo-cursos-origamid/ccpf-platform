export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  title: string;
  amount: number | string;
  type: TransactionType;
  accountId: string;
  categoryId: string;
  subCategoryId?: string | null;
  date: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionInput {
  title: string;
  amount: string;
  type: TransactionType;
  accountId: string;
  categoryId: string;
  subCategoryId?: string;
  date: string;
  description?: string;
}
