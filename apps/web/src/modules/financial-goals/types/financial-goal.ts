export type FinancialGoalStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface FinancialGoalProgress {
  contributionsAmount: number;
  transfersAmount: number;
  totalAmount: number;
  remainingAmount: number;
  percentage: number;
}

export interface FinancialGoal {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description: string | null;
  linkedAccountId: string | null;
  targetAmount: number;
  targetDate: string | null;
  status: FinancialGoalStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface FinancialGoalListItem {
  goal: FinancialGoal;
  progress: FinancialGoalProgress;
  effectiveStatus: FinancialGoalStatus;
}

export interface CreateFinancialGoalInput {
  name: string;
  description?: string;
  targetAmount: number;
  targetDate?: string;
  linkedAccountId?: string;
}

export interface AddFinancialGoalContributionInput {
  amount: number;
  date?: string;
  description?: string;
}
