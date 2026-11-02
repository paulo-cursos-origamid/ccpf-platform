export interface FinancialProjectionMonth {
  month: string;
  label: string;
  installments: number;
  recurringExpenses: number;
  expenses: number;
  projectedBalance: number;
}

export interface FinancialProjection {
  initialBalance: number;
  months: FinancialProjectionMonth[];
}
