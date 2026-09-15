import { Injectable } from '@nestjs/common';

import { AccountEntity } from '../../../domain/entities/account.entity';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { AccountRepository } from '../../../domain/repositories/account.repository';

/**
 * Dados necessários para listar as contas do usuário.
 */
export interface ListAccountsInput {
  userId: string;
  tenantId: string;
}

/**
 * Dados apresentados para cada conta.
 */
export interface ListAccountsOutput {
  id: string;
  name: string;
  role: string;
  type: string;
  currency: string;
  initialBalance: number;
  balance: number;
  status: string;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lista as contas às quais o usuário possui acesso
 * dentro do Tenant ativo.
 */
@Injectable()
export class ListAccountsUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(input: ListAccountsInput): Promise<ListAccountsOutput[]> {
    // Busca os vínculos do usuário somente no Tenant atual.
    const members = await this.accountMemberRepository.findManyByUserId(
      input.userId,
      input.tenantId,
    );

    // Para cada vínculo, recupera a conta dentro do mesmo Tenant.
    const accounts = await Promise.all(
      members.map(async (member) => ({
        member,
        account: await this.accountRepository.findById(
          member.accountId,
          input.tenantId,
        ),
      })),
    );

    // Ignora vínculos cuja conta não esteja mais disponível.
    return accounts
      .filter(
        (
          item,
        ): item is {
          member: (typeof members)[number];
          account: AccountEntity;
        } => item.account !== null,
      )
      .map(({ member, account }) => ({
        id: account.id,
        name: account.name,
        role: member.role,
        type: account.type,
        currency: account.currency,
        initialBalance: account.initialBalance,
        balance: account.balance,
        status: account.status,
        archivedAt: account.archivedAt,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      }));
  }
}
