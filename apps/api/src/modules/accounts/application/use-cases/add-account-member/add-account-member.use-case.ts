import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AccountMemberEntity } from '../../../domain/entities/account-member.entity';
import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountMemberStatus } from '../../../domain/enums/account-member-status.enum';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';

export interface AddAccountMemberInput {
  userId: string;
  accountId: string;
  memberUserId: string;
  role: AccountMemberRole;
}

@Injectable()
export class AddAccountMemberUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  async execute(input: AddAccountMemberInput): Promise<void> {
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

    if (
      currentMember.role !== AccountMemberRole.OWNER &&
      currentMember.role !== AccountMemberRole.MANAGER
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage account members',
      );
    }

    const existingMember =
      await this.accountMemberRepository.findByAccountIdAndUserId(
        input.accountId,
        input.memberUserId,
      );

    if (existingMember) {
      throw new ConflictException('User is already a member of this account');
    }

    const member = new AccountMemberEntity({
      accountId: input.accountId,
      userId: input.memberUserId,
      role: input.role,
    });

    await this.accountMemberRepository.create(member);
  }
}
