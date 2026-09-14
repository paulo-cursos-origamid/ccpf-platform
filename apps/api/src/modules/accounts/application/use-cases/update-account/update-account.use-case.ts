import { Injectable, NotFoundException } from '@nestjs/common';

import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountType } from '../../../domain/enums/account-type.enum';

import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { AccountRepository } from '../../../domain/repositories/account.repository';

export interface UpdateAccountInput {
  userId: string;
  accountId: string;
  name: string;
  type: AccountType;
}

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

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  /**
   * Atualiza os dados cadastrais de uma conta.
   *
   * A alteração é permitida somente para OWNER e MANAGER.
   * A regra de negócio da própria entidade AccountEntity
   * permanece responsável por validar se a conta pode ser modificada.
   */
  async execute(input: UpdateAccountInput): Promise<UpdateAccountOutput> {
    const currentMember =
      await this.accountMemberRepository.findByAccountIdAndUserId(
        input.accountId,
        input.userId,
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

    const account = await this.accountRepository.findById(input.accountId);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // A entidade aplica as regras de domínio para alteração.
    account.updateDetails(input.name, input.type);

    const updatedAccount = await this.accountRepository.update(account);

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
