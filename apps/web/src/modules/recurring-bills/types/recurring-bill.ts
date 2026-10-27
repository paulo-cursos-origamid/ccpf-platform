export interface RecurringBillOccurrence {
  id: string;
  recurringBillId: string;
  dueDate: string;
  expectedAmount: string | null;
  paidAmount: string | null;
  paidAt: string | null;
  status: string;
  transactionId: string | null;
}

export interface RecurringBill {
  id: string;
  title: string;
  description: string | null;
  expectedAmount: string | null;
  dueDay: number;
  frequency: string;
  isActive: boolean;
  account: { id: string; name: string };
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
