export interface FinancialGoalContribution {
  id: string;
  tenantId: string;
  goalId: string;
  userId: string;
  amount: number;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
