import { Injectable, NotFoundException } from '@nestjs/common';

import { FinancialGoalEntity } from '../../../domain/entities/financial-goal.entity';
import { FinancialGoalRepository } from '../../../domain/repositories/financial-goal.repository';
import { AccountMemberStatus } from '../../../../accounts/domain/enums/account-member-status.enum';
import { AccountMemberRepository } from '../../../../accounts/domain/repositories/account-member.repository';
import { AccountRepository } from '../../../../accounts/domain/repositories/account.repository';

export interface UpdateFinancialGoalInput {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string | null;
  linkedAccountId?: string | null;
  targetAmount: number;
  targetDate?: Date | null;
}

@Injectable()
export class UpdateFinancialGoalUseCase {
  constructor(
    private readonly financialGoalRepository: FinancialGoalRepository,
    private readonly accountRepository: AccountRepository,
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  async execute(input: UpdateFinancialGoalInput): Promise<FinancialGoalEntity> {
    const goal = await this.financialGoalRepository.findById(
      input.id,
      input.tenantId,
    );

    if (!goal) {
      throw new NotFoundException('Financial goal not found');
    }

    if (input.linkedAccountId) {
      const [account, member] = await Promise.all([
        this.accountRepository.findById(input.linkedAccountId, input.tenantId),
        this.accountMemberRepository.findByAccountIdAndUserId(
          input.linkedAccountId,
          input.userId,
          input.tenantId,
        ),
      ]);

      if (!account || !member || member.status !== AccountMemberStatus.ACTIVE) {
        throw new NotFoundException('Account not found');
      }
    }

    goal.updateDetails({
      name: input.name,
      description: input.description,
      linkedAccountId: input.linkedAccountId,
      targetAmount: input.targetAmount,
      targetDate: input.targetDate,
    });

    return this.financialGoalRepository.update(goal, input.tenantId);
  }
}
