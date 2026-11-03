import { Injectable } from '@nestjs/common';

import { FinancialGoalEntity } from '../../../domain/entities/financial-goal.entity';
import { FinancialGoalStatus } from '../../../domain/enums/financial-goal-status.enum';
import {
  FinancialGoalProgress,
  FinancialGoalRepository,
} from '../../../domain/repositories/financial-goal.repository';

export interface FinancialGoalOutput {
  goal: FinancialGoalEntity;
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
          goal,
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
