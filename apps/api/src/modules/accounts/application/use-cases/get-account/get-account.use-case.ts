import { Injectable, NotFoundException } from '@nestjs/common';

import { AccountEntity } from '../../../domain/entities/account.entity';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { AccountRepository } from '../../../domain/repositories/account.repository';
import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';

export interface GetAccountInput {
  userId: string;
  accountId: string;
}

export interface GetAccountOutput {
  id: string;
  name: string;
  role: AccountMemberRole;
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

  /**
   * Retorna os dados de uma conta para um usuário autenticado.
   *
   * O acesso é validado através do vínculo AccountMember.
   * O role retornado representa a permissão do usuário
   * especificamente dentro desta conta.
   */
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

    return this.toOutput(account, member.role);
  }

  /**
   * Converte a entidade de domínio para o contrato de saída da API.
   *
   * O role é recebido separadamente porque pertence ao vínculo
   * do usuário com a conta, e não à entidade Account.
   */
  private toOutput(
    account: AccountEntity,
    role: AccountMemberRole,
  ): GetAccountOutput {
    return {
      id: account.id,
      name: account.name,
      role,
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
