import { Injectable, NotFoundException } from '@nestjs/common';

import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { UserRepository } from '../../../../identity/domain/repositories/user.repository';

export interface ListAccountMembersInput {
  userId: string;
  accountId: string;
}

export interface ListAccountMembersOutput {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

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

    const members = await this.accountMemberRepository.findManyByAccountId(
      input.accountId,
    );

    const membersWithUsers = await Promise.all(
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
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        };
      }),
    );

    return membersWithUsers;
  }
}
