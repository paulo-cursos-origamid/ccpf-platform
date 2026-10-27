import { Injectable } from '@nestjs/common';
import {
  LedgerEntryType,
  LedgerReferenceType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { AccountMemberEntity } from '../../../domain/entities/account-member.entity';
import { AccountEntity } from '../../../domain/entities/account.entity';
import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountType } from '../../../domain/enums/account-type.enum';

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
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    const account = new AccountEntity({
      name: input.name,
      type: input.type,
      currency: input.currency,
      initialBalance: input.initialBalance,
    });

    return this.prisma.$transaction(async (tx) => {
      const savedAccount = await tx.account.create({
        data: {
          id: account.id,
          tenantId: input.tenantId,
          name: account.name,
          type: account.type,
          currency: account.currency,
          initialBalance: new Prisma.Decimal(account.initialBalance),
          balance: new Prisma.Decimal(account.balance),
          status: account.status,
          archivedAt: account.archivedAt,
        },
      });

      const owner = new AccountMemberEntity({
        accountId: savedAccount.id,
        userId: input.userId,
        role: AccountMemberRole.OWNER,
      });

      await tx.accountMember.create({
        data: {
          id: owner.id,
          accountId: owner.accountId,
          userId: owner.userId,
          role: owner.role,
          status: owner.status,
        },
      });

      const initialBalance = new Prisma.Decimal(account.initialBalance);

      if (!initialBalance.isZero()) {
        await tx.ledgerEntry.create({
          data: {
            tenantId: input.tenantId,
            userId: input.userId,
            accountId: savedAccount.id,
            type: initialBalance.isPositive()
              ? LedgerEntryType.CREDIT
              : LedgerEntryType.DEBIT,
            amount: initialBalance.abs(),
            description: 'Saldo inicial da conta',
            referenceId: savedAccount.id,
            referenceType: LedgerReferenceType.ADJUSTMENT,
          },
        });
      }

      return {
        id: savedAccount.id,
        name: savedAccount.name,
        type: savedAccount.type as AccountType,
        currency: savedAccount.currency,
        initialBalance: Number(savedAccount.initialBalance),
        balance: Number(savedAccount.balance),
        status: savedAccount.status,
        archivedAt: savedAccount.archivedAt,
        createdAt: savedAccount.createdAt,
        updatedAt: savedAccount.updatedAt,
      };
    });
  }
}
