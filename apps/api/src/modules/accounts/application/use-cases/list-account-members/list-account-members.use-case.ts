import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRepository } from '../../../../identity/domain/repositories/user.repository';

import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountMemberStatus } from '../../../domain/enums/account-member-status.enum';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';

/**
 * Entrada para a listagem dos membros de uma conta.
 */
export interface ListAccountMembersInput {
  userId: string;
  accountId: string;
}

/**
 * Dados apresentados para cada membro da conta.
 */
export interface ListAccountMembersOutput {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: AccountMemberRole;
  status: AccountMemberStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lista os membros de uma conta.
 *
 * O membro atual precisa estar ativo para acessar a administração
 * de membros. Um membro bloqueado não pode utilizar esta operação.
 */
@Injectable()
export class ListAccountMembersUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ListAccountMembersInput,
  ): Promise<ListAccountMembersOutput[]> {
    const currentMember =
      await this.accountMemberRepository.findByAccountIdAndUserId(
        input.accountId,
        input.userId,
      );

    if (!currentMember) {
      throw new NotFoundException('Account not found');
    }

    if (currentMember.status !== AccountMemberStatus.ACTIVE) {
      throw new ForbiddenException('Account access is blocked');
    }

    const members = await this.accountMemberRepository.findManyByAccountId(
      input.accountId,
    );

    return Promise.all(
      members.map(async (member) => {
        const user = await this.userRepository.findById(member.userId);

        if (!user) {
          throw new NotFoundException('User not found');
        }

        return {
          id: member.id,
          userId: member.userId,
          name: user.name,
          email: user.email,
          role: member.role,
          status: member.status,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        };
      }),
    );
  }
}
