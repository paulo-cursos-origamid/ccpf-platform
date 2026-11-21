export type TransactionType = "INCOME" | "EXPENSE";

export type FinancialPaymentMethod =
  | "CASH"
  | "PIX"
  | "BANK_SLIP"
  | "DEBIT_CARD";

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

export interface Transfer {
  id: string;
  amount: number | string;
  description?: string | null;
  createdAt: string;
  fromAccount: { id: string; name: string; currency: string };
  toAccount: { id: string; name: string; currency: string };
}

export interface CreateTransactionInput {
  title: string;
  amount: string;
  type: TransactionType;
  paymentMethod: FinancialPaymentMethod;
  accountId: string;
  categoryId: string;
  subCategoryId?: string;
  date: string;
  description?: string;
}
