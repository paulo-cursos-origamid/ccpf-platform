import { Injectable, NotFoundException } from '@nestjs/common';

import { FinancialGoalStatus } from '../../../domain/enums/financial-goal-status.enum';
import { FinancialGoalRepository } from '../../../domain/repositories/financial-goal.repository';
import { FinancialGoalOutput } from '../list-financial-goals/list-financial-goals.use-case';

export interface GetFinancialGoalInput {
  id: string;
  tenantId: string;
}

@Injectable()
export class GetFinancialGoalUseCase {
  constructor(
    private readonly financialGoalRepository: FinancialGoalRepository,
  ) {}

  async execute(input: GetFinancialGoalInput): Promise<FinancialGoalOutput> {
    const goal = await this.financialGoalRepository.findById(
      input.id,
      input.tenantId,
    );

    if (!goal) {
      throw new NotFoundException('Financial goal not found');
    }

    const progress = await this.financialGoalRepository.getProgress(
      goal.id,
      input.tenantId,
      goal.targetAmount,
    );

    const effectiveStatus =
      goal.status === FinancialGoalStatus.ARCHIVED
        ? FinancialGoalStatus.ARCHIVED
        : progress.totalAmount >= goal.targetAmount
          ? FinancialGoalStatus.COMPLETED
          : FinancialGoalStatus.ACTIVE;

    return { goal, progress, effectiveStatus };
  }
}
