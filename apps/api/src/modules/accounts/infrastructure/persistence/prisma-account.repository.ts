import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { AccountEntity } from '../../domain/entities/account.entity';
import { AccountStatus } from '../../domain/enums/account-status.enum';
import { AccountType } from '../../domain/enums/account-type.enum';
import { AccountRepository } from '../../domain/repositories/account.repository';

import {
  AccountStatus as PrismaAccountStatus,
  AccountType as PrismaAccountType,
} from '@prisma/client';

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(account: AccountEntity): Promise<AccountEntity> {
    const createdAccount = await this.prisma.account.create({
      data: {
        id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency,
        initialBalance: account.initialBalance,
        balance: account.balance,
        status: account.status,
        archivedAt: account.archivedAt,
      },
    });

    return this.toDomain(createdAccount);
  }

  async findById(id: string): Promise<AccountEntity | null> {
    const account = await this.prisma.account.findUnique({
      where: {
        id,
      },
    });

    if (!account) {
      return null;
    }

    return this.toDomain(account);
  }

  async update(account: AccountEntity): Promise<AccountEntity> {
    const updatedAccount = await this.prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        name: account.name,
        type: account.type,
        balance: account.balance,
        status: account.status,
        archivedAt: account.archivedAt,
      },
    });

    return this.toDomain(updatedAccount);
  }

  private toDomain(rawAccount: {
    id: string;
    name: string;
    type: PrismaAccountType;
    currency: string;
    initialBalance: unknown;
    balance: unknown;
    status: PrismaAccountStatus;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AccountEntity {
    return new AccountEntity({
      id: rawAccount.id,
      name: rawAccount.name,
      type: rawAccount.type as AccountType,
      currency: rawAccount.currency,
      initialBalance: Number(rawAccount.initialBalance),
      balance: Number(rawAccount.balance),
      status: rawAccount.status as AccountStatus,
      archivedAt: rawAccount.archivedAt,
      createdAt: rawAccount.createdAt,
      updatedAt: rawAccount.updatedAt,
    });
  }
}
