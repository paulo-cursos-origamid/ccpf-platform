import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { TenantMemberEntity } from '../../domain/entities/tenant-member.entity';
import { TenantMemberStatus } from '../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../domain/repositories/tenant-member.repository';

/**
 * Implementação Prisma do repositório de membros de Tenant.
 *
 * Responsável exclusivamente por traduzir entre:
 * - entidade de domínio TenantMemberEntity;
 * - registro persistido pelo Prisma.
 *
 * A validação de autorização e as regras de negócio
 * permanecem na camada de aplicação/domínio.
 */
@Injectable()
export class PrismaTenantMemberRepository implements TenantMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persiste uma nova associação entre usuário e Tenant.
   */
  async create(member: TenantMemberEntity): Promise<TenantMemberEntity> {
    const createdMember = await this.prisma.tenantMember.create({
      data: {
        id: member.id,
        tenantId: member.tenantId,
        userId: member.userId,
        role: member.role,
        status: member.status,
      },
    });

    return this.toDomain(createdMember);
  }

  /**
   * Busca uma associação pelo seu identificador.
   */
  async findById(id: string): Promise<TenantMemberEntity | null> {
    const member = await this.prisma.tenantMember.findUnique({
      where: {
        id,
      },
    });

    return member ? this.toDomain(member) : null;
  }

  /**
   * Busca a associação entre um usuário e um Tenant.
   *
   * A combinação tenantId + userId é única no banco.
   */
  async findByTenantAndUser(
    tenantId: string,
    userId: string,
  ): Promise<TenantMemberEntity | null> {
    const member = await this.prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    return member ? this.toDomain(member) : null;
  }

  /**
   * Lista todos os Tenants aos quais um usuário está associado.
   */
  async findByUser(userId: string): Promise<TenantMemberEntity[]> {
    const members = await this.prisma.tenantMember.findMany({
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
   * Lista todos os usuários associados a um Tenant.
   */
  async findByTenant(tenantId: string): Promise<TenantMemberEntity[]> {
    const members = await this.prisma.tenantMember.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return members.map((member) => this.toDomain(member));
  }

  /**
   * Conta os usuários que ocupam vagas no Tenant.
   *
   * Membros REMOVED não são considerados, pois não possuem
   * mais acesso ao Tenant e não devem consumir o limite do plano.
   */
  async countByTenant(tenantId: string): Promise<number> {
    return this.prisma.tenantMember.count({
      where: {
        tenantId,
        status: {
          not: 'REMOVED',
        },
      },
    });
  }

  /**
   * Atualiza papel e status da associação.
   */
  async update(member: TenantMemberEntity): Promise<TenantMemberEntity> {
    const updatedMember = await this.prisma.tenantMember.update({
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
   * Converte o registro persistido pelo Prisma
   * para a entidade de domínio TenantMemberEntity.
   *
   * Os valores de role e status são convertidos para
   * os enums definidos pelo domínio.
   */
  private toDomain(rawMember: {
    id: string;
    tenantId: string;
    userId: string;
    role: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): TenantMemberEntity {
    return new TenantMemberEntity({
      id: rawMember.id,
      tenantId: rawMember.tenantId,
      userId: rawMember.userId,
      role: rawMember.role as TenantRole,
      status: rawMember.status as TenantMemberStatus,
      createdAt: rawMember.createdAt,
      updatedAt: rawMember.updatedAt,
    });
  }
}
