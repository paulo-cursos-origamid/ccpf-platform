import { Injectable, NotFoundException } from '@nestjs/common';

import { FinancialGoalEntity } from '../../../domain/entities/financial-goal.entity';
import { FinancialGoalRepository } from '../../../domain/repositories/financial-goal.repository';

export interface ArchiveFinancialGoalInput {
  id: string;
  tenantId: string;
}

@Injectable()
export class ArchiveFinancialGoalUseCase {
  constructor(
    private readonly financialGoalRepository: FinancialGoalRepository,
  ) {}

  async execute(
    input: ArchiveFinancialGoalInput,
  ): Promise<FinancialGoalEntity> {
    const goal = await this.financialGoalRepository.findById(
      input.id,
      input.tenantId,
    );

    if (!goal) {
      throw new NotFoundException('Financial goal not found');
    }

    goal.archive();

    return this.financialGoalRepository.update(goal, input.tenantId);
  }
}
