import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountMemberStatus } from '../../../domain/enums/account-member-status.enum';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';

/**
 * Entrada para alteração da permissão de um membro.
 */
export interface UpdateAccountMemberRoleInput {
  userId: string;
  accountId: string;
  memberId: string;
  role: AccountMemberRole;
}

/**
 * Altera a função de um membro dentro de uma conta.
 *
 * Regra atual:
 * - somente OWNER pode alterar permissões;
 * - OWNER não pode alterar a si próprio;
 * - não é permitido promover outro usuário a OWNER;
 * - o OWNER atual continua sendo único.
 */
@Injectable()
export class UpdateAccountMemberRoleUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  async execute(input: UpdateAccountMemberRoleInput): Promise<void> {
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

    if (currentMember.role !== AccountMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only the account owner can change member permissions',
      );
    }

    const targetMember = await this.findTargetMember(input);

    if (targetMember.userId === input.userId) {
      throw new BadRequestException(
        'The account owner cannot change their own role',
      );
    }

    if (input.role === AccountMemberRole.OWNER) {
      throw new BadRequestException(
        'The account owner role cannot be assigned to another member',
      );
    }

    targetMember.changeRole(input.role);

    await this.accountMemberRepository.update(targetMember);
  }

  private async findTargetMember(input: UpdateAccountMemberRoleInput) {
    const members = await this.accountMemberRepository.findManyByAccountId(
      input.accountId,
    );

    const member = members.find((item) => item.id === input.memberId);

    if (!member) {
      throw new NotFoundException('Account member not found');
    }

    return member;
  }
}
