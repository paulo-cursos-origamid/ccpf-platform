import { Injectable, NotFoundException } from '@nestjs/common';

import { FinancialGoalContributionEntity } from '../../../domain/entities/financial-goal-contribution.entity';
import { FinancialGoalRepository } from '../../../domain/repositories/financial-goal.repository';

export interface ListFinancialGoalContributionsInput {
  goalId: string;
  tenantId: string;
}

@Injectable()
export class ListFinancialGoalContributionsUseCase {
  constructor(
    private readonly financialGoalRepository: FinancialGoalRepository,
  ) {}

  async execute(
    input: ListFinancialGoalContributionsInput,
  ): Promise<FinancialGoalContributionEntity[]> {
    const goal = await this.financialGoalRepository.findById(
      input.goalId,
      input.tenantId,
    );

    if (!goal) {
      throw new NotFoundException('Financial goal not found');
    }

    return this.financialGoalRepository.listContributions(
      input.goalId,
      input.tenantId,
    );
  }
}
