import { Injectable, NotFoundException } from '@nestjs/common';

import { FinancialGoalEntity } from '../../../domain/entities/financial-goal.entity';
import { FinancialGoalRepository } from '../../../domain/repositories/financial-goal.repository';

export interface RestoreFinancialGoalInput {
  id: string;
  tenantId: string;
}

@Injectable()
export class RestoreFinancialGoalUseCase {
  constructor(
    private readonly financialGoalRepository: FinancialGoalRepository,
  ) {}

  async execute(
    input: RestoreFinancialGoalInput,
  ): Promise<FinancialGoalEntity> {
    const goal = await this.financialGoalRepository.findById(
      input.id,
      input.tenantId,
    );

    if (!goal) {
      throw new NotFoundException('Financial goal not found');
    }

    goal.restore();

    return this.financialGoalRepository.update(goal, input.tenantId);
  }
}
