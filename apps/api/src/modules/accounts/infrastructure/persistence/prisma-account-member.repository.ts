import { Injectable } from '@nestjs/common';

import {
  AccountMemberRole as PrismaAccountMemberRole,
  AccountMemberStatus as PrismaAccountMemberStatus,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { AccountMemberEntity } from '../../domain/entities/account-member.entity';
import { AccountMemberRole } from '../../domain/enums/account-member-role.enum';
import { AccountMemberStatus } from '../../domain/enums/account-member-status.enum';
import { AccountMemberRepository } from '../../domain/repositories/account-member.repository';

/**
 * Implementação Prisma do repositório de membros de contas.
 *
 * Responsável exclusivamente por traduzir entre:
 * - entidades do domínio;
 * - registros persistidos pelo Prisma.
 */
@Injectable()
export class PrismaAccountMemberRepository implements AccountMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persiste um novo vínculo de usuário com uma conta.
   */
  async create(member: AccountMemberEntity): Promise<AccountMemberEntity> {
    const createdMember = await this.prisma.accountMember.create({
      data: {
        id: member.id,
        accountId: member.accountId,
        userId: member.userId,
        role: member.role,
        status: member.status,
      },
    });

    return this.toDomain(createdMember);
  }

  /**
   * Atualiza papel e status do membro.
   */
  async update(member: AccountMemberEntity): Promise<AccountMemberEntity> {
    const updatedMember = await this.prisma.accountMember.update({
      where: {
        id: member.id,
      },
      data: {
        role: member.role,
        status: member.status,
      },
    });

    return this.toDomain(updatedMember);
  }

  /**
   * Remove definitivamente o vínculo do membro.
   *
   * Continua disponível para futuras operações administrativas,
   * mas o bloqueio normal deve utilizar block() em vez de delete().
   */
  async delete(member: AccountMemberEntity): Promise<void> {
    await this.prisma.accountMember.delete({
      where: {
        id: member.id,
      },
    });
  }

  /**
   * Busca um membro específico pelo par conta + usuário.
   */
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

    return member ? this.toDomain(member) : null;
  }

  /**
   * Lista todos os membros de uma conta.
   */
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

  /**
   * Lista todos os vínculos de um usuário.
   */
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

  /**
   * Converte o registro Prisma para a entidade de domínio.
   */
  private toDomain(rawMember: {
    id: string;
    accountId: string;
    userId: string;
    role: PrismaAccountMemberRole;
    status: PrismaAccountMemberStatus;
    createdAt: Date;
    updatedAt: Date;
  }): AccountMemberEntity {
    return new AccountMemberEntity({
      id: rawMember.id,
      accountId: rawMember.accountId,
      userId: rawMember.userId,
      role: rawMember.role as AccountMemberRole,
      status: rawMember.status as AccountMemberStatus,
      createdAt: rawMember.createdAt,
      updatedAt: rawMember.updatedAt,
    });
  }
}
