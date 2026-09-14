import { Injectable, NotFoundException } from '@nestjs/common';

import { UserRepository } from '../../../../identity/domain/repositories/user.repository';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';

export interface ListAvailableAccountUsersInput {
  userId: string;
  accountId: string;
}

export interface ListAvailableAccountUsersOutput {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class ListAvailableAccountUsersUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Lista os usuários que ainda não possuem vínculo com a conta.
   *
   * O usuário autenticado precisa ser OWNER ou MANAGER da conta.
   * A filtragem dos membros existentes acontece dentro do contexto
   * de Accounts, mantendo a regra de acesso fora do módulo Identity.
   */
  async execute(
    input: ListAvailableAccountUsersInput,
  ): Promise<ListAvailableAccountUsersOutput[]> {
    const currentMember =
      await this.accountMemberRepository.findByAccountIdAndUserId(
        input.accountId,
        input.userId,
      );

    if (!currentMember) {
      throw new NotFoundException('Account not found');
    }

    if (
      currentMember.role !== AccountMemberRole.OWNER &&
      currentMember.role !== AccountMemberRole.MANAGER
    ) {
      throw new NotFoundException('Account not found');
    }

    const existingMembers =
      await this.accountMemberRepository.findManyByAccountId(input.accountId);

    const existingMemberIds = new Set(
      existingMembers.map((member) => member.userId),
    );

    const result = await this.userRepository.findMany({
      page: 1,
      limit: 100,
    });

    return result.users
      .filter((user) => !existingMemberIds.has(user.id))
      .filter((user) => user.isActive)
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }));
  }
}
