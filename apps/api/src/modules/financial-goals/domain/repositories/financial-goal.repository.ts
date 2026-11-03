import { FinancialGoalEntity } from '../entities/financial-goal.entity';
import { FinancialGoalContributionEntity } from '../entities/financial-goal-contribution.entity';

export interface FinancialGoalProgress {
  contributionsAmount: number;
  transfersAmount: number;
  totalAmount: number;
  remainingAmount: number;
  percentage: number;
}

export abstract class FinancialGoalRepository {
  abstract create(goal: FinancialGoalEntity): Promise<FinancialGoalEntity>;

  abstract findById(
    id: string,
    tenantId: string,
  ): Promise<FinancialGoalEntity | null>;

  abstract findMany(tenantId: string): Promise<FinancialGoalEntity[]>;

  abstract update(
    goal: FinancialGoalEntity,
    tenantId: string,
  ): Promise<FinancialGoalEntity>;

  abstract createContribution(
    contribution: FinancialGoalContributionEntity,
  ): Promise<FinancialGoalContributionEntity>;

  abstract listContributions(
    goalId: string,
    tenantId: string,
  ): Promise<FinancialGoalContributionEntity[]>;

  abstract softDeleteContribution(
    contributionId: string,
    goalId: string,
    tenantId: string,
  ): Promise<boolean>;

  abstract getProgress(
    goalId: string,
    tenantId: string,
    targetAmount: number,
  ): Promise<FinancialGoalProgress>;
}
