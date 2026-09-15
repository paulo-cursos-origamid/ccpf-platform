import { Injectable } from '@nestjs/common';

import {
  AccountStatus as PrismaAccountStatus,
  AccountType as PrismaAccountType,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { AccountEntity } from '../../domain/entities/account.entity';
import { AccountStatus } from '../../domain/enums/account-status.enum';
import { AccountType } from '../../domain/enums/account-type.enum';
import { AccountRepository } from '../../domain/repositories/account.repository';

/**
 * Implementação Prisma do repositório de contas.
 *
 * Responsável exclusivamente por traduzir entre:
 * - entidade AccountEntity;
 * - registros persistidos pelo Prisma.
 *
 * O tenantId é recebido explicitamente em cada operação para garantir
 * que as contas sejam sempre acessadas dentro do Tenant correto.
 */
@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova conta vinculada ao Tenant informado.
   */
  async create(
    account: AccountEntity,
    tenantId: string,
  ): Promise<AccountEntity> {
    const createdAccount = await this.prisma.account.create({
      data: {
        id: account.id,
        tenantId,
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

  /**
   * Busca uma conta garantindo que ela pertença ao Tenant informado.
   */
  async findById(id: string, tenantId: string): Promise<AccountEntity | null> {
    const account = await this.prisma.account.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!account) {
      return null;
    }

    return this.toDomain(account);
  }

  /**
   * Atualiza uma conta garantindo que ela pertença ao Tenant informado.
   */
  async update(
    account: AccountEntity,
    tenantId: string,
  ): Promise<AccountEntity> {
    const updatedAccount = await this.prisma.account.updateMany({
      where: {
        id: account.id,
        tenantId,
      },
      data: {
        name: account.name,
        type: account.type,
        balance: account.balance,
        status: account.status,
        archivedAt: account.archivedAt,
      },
    });

    if (updatedAccount.count === 0) {
      throw new Error('Account not found in the specified Tenant');
    }

    const persistedAccount = await this.prisma.account.findUnique({
      where: {
        id: account.id,
      },
    });

    if (!persistedAccount) {
      throw new Error('Account not found after update');
    }

    return this.toDomain(persistedAccount);
  }

  /**
   * Converte um registro Prisma para a entidade de domínio.
   */
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
