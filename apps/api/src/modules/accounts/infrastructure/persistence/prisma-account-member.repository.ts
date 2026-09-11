import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { AccountMemberEntity } from '../../domain/entities/account-member.entity';
import { AccountMemberRole } from '../../domain/enums/account-member-role.enum';
import { AccountMemberRepository } from '../../domain/repositories/account-member.repository';

import { AccountMemberRole as PrismaAccountMemberRole } from '@prisma/client';

@Injectable()
export class PrismaAccountMemberRepository implements AccountMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(member: AccountMemberEntity): Promise<AccountMemberEntity> {
    const createdMember = await this.prisma.accountMember.create({
      data: {
        id: member.id,
        accountId: member.accountId,
        userId: member.userId,
        role: member.role,
      },
    });

    return this.toDomain(createdMember);
  }
  async update(member: AccountMemberEntity): Promise<AccountMemberEntity> {
    const updatedMember = await this.prisma.accountMember.update({
      where: {
        id: member.id,
      },
      data: {
        role: member.role,
      },
    });

    return this.toDomain(updatedMember);
  }

  async delete(member: AccountMemberEntity): Promise<void> {
    await this.prisma.accountMember.delete({
      where: {
        id: member.id,
      },
    });
  }
  async findByAccountIdAndUserId(
    accountId: string,
    userId: string,
  ): Promise<AccountMemberEntity | null> {
    const member = await this.prisma.accountMember.findUnique({
      where: {
        accountId_userId: {
          accountId,
          userId,
        },
      },
    });

    if (!member) {
      return null;
    }

    return this.toDomain(member);
  }

  async findManyByAccountId(accountId: string): Promise<AccountMemberEntity[]> {
    const members = await this.prisma.accountMember.findMany({
      where: {
        accountId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return members.map((member) => this.toDomain(member));
  }

  async findManyByUserId(userId: string): Promise<AccountMemberEntity[]> {
    const members = await this.prisma.accountMember.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return members.map((member) => this.toDomain(member));
  }

  private toDomain(rawMember: {
    id: string;
    accountId: string;
    userId: string;
    role: PrismaAccountMemberRole;
    createdAt: Date;
    updatedAt: Date;
  }): AccountMemberEntity {
    return new AccountMemberEntity({
      id: rawMember.id,
      accountId: rawMember.accountId,
      userId: rawMember.userId,
      role: rawMember.role as AccountMemberRole,
      createdAt: rawMember.createdAt,
      updatedAt: rawMember.updatedAt,
    });
  }
}
