import { Injectable } from '@nestjs/common';

import { AccountMemberEntity } from '../../../domain/entities/account-member.entity';
import { AccountEntity } from '../../../domain/entities/account.entity';

import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountType } from '../../../domain/enums/account-type.enum';

import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { AccountRepository } from '../../../domain/repositories/account.repository';

export interface CreateAccountInput {
  userId: string;
  tenantId: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
}

export interface CreateAccountOutput {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  balance: number;
  status: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    const account = new AccountEntity({
      name: input.name,
      type: input.type,
      currency: input.currency,
      initialBalance: input.initialBalance,
    });

    const savedAccount = await this.accountRepository.create(
      account,
      input.tenantId,
    );

    const owner = new AccountMemberEntity({
      accountId: savedAccount.id,
      userId: input.userId,
      role: AccountMemberRole.OWNER,
    });

    await this.accountMemberRepository.create(owner);

    return {
      id: savedAccount.id,
      name: savedAccount.name,
      type: savedAccount.type,
      currency: savedAccount.currency,
      initialBalance: savedAccount.initialBalance,
      balance: savedAccount.balance,
      status: savedAccount.status,
      archivedAt: savedAccount.archivedAt,
      createdAt: savedAccount.createdAt,
      updatedAt: savedAccount.updatedAt,
    };
  }
}
