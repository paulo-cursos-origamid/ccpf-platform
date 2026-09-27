import { Injectable, NotFoundException } from '@nestjs/common';

import { AccountEntity } from '../../../domain/entities/account.entity';
import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { AccountRepository } from '../../../domain/repositories/account.repository';

/**
 * Dados necessários para consultar uma conta.
 */
export interface GetAccountInput {
  userId: string;
  tenantId: string;
  accountId: string;
}

/**
 * Dados públicos da conta retornados pela aplicação.
 */
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

/**
 * Consulta uma conta respeitando o Tenant ativo.
 *
 * O acesso é determinado pelo vínculo AccountMember.
 */
@Injectable()
export class GetAccountUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
    private readonly accountRepository: AccountRepository,
  ) {}

  async execute(input: GetAccountInput): Promise<GetAccountOutput> {
    // Valida que o usuário possui vínculo com a conta
    // dentro do Tenant informado.
    const member = await this.accountMemberRepository.findByAccountIdAndUserId(
      input.accountId,
      input.userId,
      input.tenantId,
    );

    if (!member) {
      throw new NotFoundException('Account not found');
    }

    // A conta também é consultada de forma tenant-scoped.
    const account = await this.accountRepository.findById(
      input.accountId,
      input.tenantId,
    );

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.toOutput(account, member.role);
  }

  /**
   * Converte a entidade de domínio para o contrato de saída da API.
   *
   * O role pertence ao vínculo do usuário com a conta,
   * por isso é recebido separadamente da entidade Account.
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
