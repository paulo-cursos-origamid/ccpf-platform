import { Injectable, NotFoundException } from '@nestjs/common';

import { AccountEntity } from '../../../domain/entities/account.entity';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { AccountRepository } from '../../../domain/repositories/account.repository';

export interface GetAccountInput {
  userId: string;
  accountId: string;
}

export interface GetAccountOutput {
  id: string;
  name: string;
  type: string;
  currency: string;
  initialBalance: number;
  balance: number;
  status: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetAccountUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(input: GetAccountInput): Promise<GetAccountOutput> {
    const member = await this.accountMemberRepository.findByAccountIdAndUserId(
      input.accountId,
      input.userId,
    );

    if (!member) {
      throw new NotFoundException('Account not found');
    }

    const account = await this.accountRepository.findById(input.accountId);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.toOutput(account);
  }

  private toOutput(account: AccountEntity): GetAccountOutput {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance,
      balance: account.balance,
      status: account.status,
      archivedAt: account.archivedAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
