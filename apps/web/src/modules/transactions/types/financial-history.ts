export type FinancialHistoryStatus = "COMPLETED" | "REVERSED";
export type FinancialHistoryOperationType = "TRANSACTION" | "TRANSFER";
export type FinancialHistoryDirection = "INCOME" | "EXPENSE" | "TRANSFER";

export type FinancialHistoryOrigin =
  | "MANUAL"
  | "INSTALLMENT"
  | "RECURRING_BILL"
  | "TRANSFER";

export interface FinancialHistoryItem {
  id: string;
  operationType: FinancialHistoryOperationType;
  origin: FinancialHistoryOrigin;
  originDescription: string | null;
  title: string;
  description?: string | null;
  date: string;
  amount: number | string;
  direction: FinancialHistoryDirection;
  accountName: string | null;
  categoryName: string | null;
  fromAccountName: string | null;
  toAccountName: string | null;
  status: FinancialHistoryStatus;
}
