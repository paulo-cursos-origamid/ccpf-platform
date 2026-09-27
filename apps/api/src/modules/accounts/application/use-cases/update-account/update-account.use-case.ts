import { Injectable, NotFoundException } from '@nestjs/common';

import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountType } from '../../../domain/enums/account-type.enum';

import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { AccountRepository } from '../../../domain/repositories/account.repository';

/**
 * Dados necessários para atualizar uma conta.
 */
export interface UpdateAccountInput {
  userId: string;
  tenantId: string;
  accountId: string;
  name: string;
  type: AccountType;
}

/**
 * Dados retornados após a atualização da conta.
 */
export interface UpdateAccountOutput {
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

/**
 * Atualiza os dados cadastrais de uma conta.
 *
 * A alteração é permitida somente para OWNER e MANAGER.
 * A entidade AccountEntity permanece responsável pelas
 * regras próprias de alteração da conta.
 */
@Injectable()
export class UpdateAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  async execute(input: UpdateAccountInput): Promise<UpdateAccountOutput> {
    // Valida o vínculo do usuário com a conta dentro do Tenant.
    const currentMember =
      await this.accountMemberRepository.findByAccountIdAndUserId(
        input.accountId,
        input.userId,
        input.tenantId,
      );

    // Não expõe a existência da conta para usuários sem vínculo.
    if (!currentMember) {
      throw new NotFoundException('Account not found');
    }

    // Somente OWNER e MANAGER podem editar os dados da conta.
    if (
      currentMember.role !== AccountMemberRole.OWNER &&
      currentMember.role !== AccountMemberRole.MANAGER
    ) {
      throw new NotFoundException('Account not found');
    }

    // Busca a conta dentro do Tenant ativo.
    const account = await this.accountRepository.findById(
      input.accountId,
      input.tenantId,
    );

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // A entidade aplica as regras de domínio para alteração.
    account.updateDetails(input.name, input.type);

    // Persiste a alteração mantendo o Tenant explícito.
    const updatedAccount = await this.accountRepository.update(
      account,
      input.tenantId,
    );

    return {
      id: updatedAccount.id,
      name: updatedAccount.name,
      type: updatedAccount.type,
      currency: updatedAccount.currency,
      initialBalance: updatedAccount.initialBalance,
      balance: updatedAccount.balance,
      status: updatedAccount.status,
      archivedAt: updatedAccount.archivedAt,
      createdAt: updatedAccount.createdAt,
      updatedAt: updatedAccount.updatedAt,
    };
  }
}
