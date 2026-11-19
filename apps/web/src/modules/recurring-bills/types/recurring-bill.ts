export interface RecurringBillOccurrence {
  id: string;
  recurringBillId: string;
  dueDate: string;
  expectedAmount: string | null;
  paidAmount: string | null;
  paidAt: string | null;
  status: string;
  transactionId: string | null;
  paymentMethod?: "CASH" | "PIX" | "BANK_SLIP" | "CREDIT_CARD" | null;
  creditCardPurchaseId?: string | null;
}

export type RecurringBillPaymentMethod =
  | "CASH"
  | "PIX"
  | "BANK_SLIP"
  | "CREDIT_CARD";

export interface PayRecurringBillInput {
  amount: string;
  paidAt: string;
  paymentMethod: RecurringBillPaymentMethod;
  accountId?: string;
  creditCardId?: string;
}

export interface RecurringBill {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  expectedAmount: string | null;
  dueDay: number;
  frequency: string;
  isActive: boolean;
  account: { id: string; name: string } | null;
  category: { id: string; name: string };
  occurrences: RecurringBillOccurrence[];
}

export interface CreateRecurringBillInput {
  title: string;
  expectedAmount?: string;
  accountId: string;
  categoryId: string;
  frequency: "MONTHLY";
  dueDay: number;
  startDate: string;
  description?: string;
}

/** Campos editáveis pelo criador de uma conta recorrente. */
export interface UpdateRecurringBillInput {
  dueDay: number;
  expectedAmount?: string;
}
