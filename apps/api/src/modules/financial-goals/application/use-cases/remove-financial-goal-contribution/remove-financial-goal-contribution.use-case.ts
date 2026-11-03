import { Injectable, NotFoundException } from '@nestjs/common';

import { FinancialGoalRepository } from '../../../domain/repositories/financial-goal.repository';

export interface RemoveFinancialGoalContributionInput {
  contributionId: string;
  goalId: string;
  tenantId: string;
}

@Injectable()
export class RemoveFinancialGoalContributionUseCase {
  constructor(
    private readonly financialGoalRepository: FinancialGoalRepository,
  ) {}

  async execute(input: RemoveFinancialGoalContributionInput): Promise<void> {
    const goal = await this.financialGoalRepository.findById(
      input.goalId,
      input.tenantId,
    );

    if (!goal) {
      throw new NotFoundException('Financial goal not found');
    }

    const removed = await this.financialGoalRepository.softDeleteContribution(
      input.contributionId,
      input.goalId,
      input.tenantId,
    );

    if (!removed) {
      throw new NotFoundException('Financial goal contribution not found');
    }
  }
}
