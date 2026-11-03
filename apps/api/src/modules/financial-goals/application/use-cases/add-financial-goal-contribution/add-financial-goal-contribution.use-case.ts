import { Injectable, NotFoundException } from '@nestjs/common';

import { FinancialGoalContributionEntity } from '../../../domain/entities/financial-goal-contribution.entity';
import { FinancialGoalRepository } from '../../../domain/repositories/financial-goal.repository';

export interface AddFinancialGoalContributionInput {
  goalId: string;
  tenantId: string;
  userId: string;
  amount: number;
  date?: Date;
  description?: string | null;
}

@Injectable()
export class AddFinancialGoalContributionUseCase {
  constructor(
    private readonly financialGoalRepository: FinancialGoalRepository,
  ) {}

  async execute(
    input: AddFinancialGoalContributionInput,
  ): Promise<FinancialGoalContributionEntity> {
    const goal = await this.financialGoalRepository.findById(
      input.goalId,
      input.tenantId,
    );

    if (!goal) {
      throw new NotFoundException('Financial goal not found');
    }

    goal.ensureCanReceiveContributions();

    const contribution = new FinancialGoalContributionEntity({
      tenantId: input.tenantId,
      goalId: goal.id,
      userId: input.userId,
      amount: input.amount,
      date: input.date,
      description: input.description,
    });

    return this.financialGoalRepository.createContribution(contribution);
  }
}
