import { Injectable } from '@nestjs/common';

import { FinancialGoalEntity } from '../../../domain/entities/financial-goal.entity';
import { FinancialGoalStatus } from '../../../domain/enums/financial-goal-status.enum';
import {
  FinancialGoalProgress,
  FinancialGoalRepository,
} from '../../../domain/repositories/financial-goal.repository';

export interface FinancialGoalOutput {
  goal: {
    id: string;
    tenantId: string;
    userId: string;
    name: string;
    description: string | null;
    linkedAccountId: string | null;
    targetAmount: number;
    targetDate: Date | null;
    status: FinancialGoalStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };
  progress: FinancialGoalProgress;
  effectiveStatus: FinancialGoalStatus;
}

@Injectable()
export class ListFinancialGoalsUseCase {
  constructor(
    private readonly financialGoalRepository: FinancialGoalRepository,
  ) {}

  async execute(tenantId: string): Promise<FinancialGoalOutput[]> {
    const goals = await this.financialGoalRepository.findMany(tenantId);

    return Promise.all(
      goals.map(async (goal) => {
        const progress = await this.financialGoalRepository.getProgress(
          goal.id,
          tenantId,
          goal.targetAmount,
        );

        return {
          goal: {
            id: goal.id,
            tenantId: goal.tenantId,
            userId: goal.userId,
            name: goal.name,
            description: goal.description,
            linkedAccountId: goal.linkedAccountId,
            targetAmount: goal.targetAmount,
            targetDate: goal.targetDate,
            status: goal.status,
            createdAt: goal.createdAt,
            updatedAt: goal.updatedAt,
            deletedAt: goal.deletedAt,
          },
          progress,
          effectiveStatus: this.getEffectiveStatus(goal, progress),
        };
      }),
    );
  }

  private getEffectiveStatus(
    goal: FinancialGoalEntity,
    progress: FinancialGoalProgress,
  ): FinancialGoalStatus {
    if (goal.status === FinancialGoalStatus.ARCHIVED) {
      return FinancialGoalStatus.ARCHIVED;
    }

    return progress.totalAmount >= goal.targetAmount
      ? FinancialGoalStatus.COMPLETED
      : FinancialGoalStatus.ACTIVE;
  }
}
