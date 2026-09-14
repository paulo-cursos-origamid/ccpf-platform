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
 * Entrada para bloqueio de um membro.
 */
export interface BlockAccountMemberInput {
  userId: string;
  accountId: string;
  memberId: string;
}

/**
 * Bloqueia o acesso de um membro à conta.
 *
 * O bloqueio é específico do vínculo AccountMember.
 * O usuário continua ativo no Identity e pode possuir acesso
 * normal a outras contas.
 */
@Injectable()
export class BlockAccountMemberUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  async execute(input: BlockAccountMemberInput): Promise<void> {
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
      throw new ForbiddenException('Only the account owner can block members');
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
        'The account owner cannot block themselves',
      );
    }

    targetMember.block();

    await this.accountMemberRepository.update(targetMember);
  }
}
