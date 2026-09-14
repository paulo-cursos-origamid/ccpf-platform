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
 * Entrada para desbloqueio de um membro.
 */
export interface UnblockAccountMemberInput {
  userId: string;
  accountId: string;
  memberId: string;
}

/**
 * Restaura o acesso de um membro à conta.
 *
 * Somente o OWNER pode desbloquear membros.
 */
@Injectable()
export class UnblockAccountMemberUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  async execute(input: UnblockAccountMemberInput): Promise<void> {
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
        'Only the account owner can unblock members',
      );
    }

    const members = await this.accountMemberRepository.findManyByAccountId(
      input.accountId,
    );

    const targetMember = members.find((member) => member.id === input.memberId);

    if (!targetMember) {
      throw new NotFoundException('Account member not found');
    }

    if (targetMember.userId === input.userId) {
      throw new BadRequestException(
        'The account owner cannot unblock themselves',
      );
    }

    targetMember.unblock();

    await this.accountMemberRepository.update(targetMember);
  }
}
