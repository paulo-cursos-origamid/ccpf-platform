import { Injectable } from '@nestjs/common';
import { TenantStatus as PrismaTenantStatus } from '@prisma/client';
import { TenantRole as PrismaTenantRole } from '@prisma/client';
import { TenantMemberStatus as PrismaTenantMemberStatus } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { TenantMemberEntity } from '../../domain/entities/tenant-member.entity';
import { TenantEntity } from '../../domain/entities/tenant.entity';
import { TenantMemberStatus } from '../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../domain/enums/tenant-role.enum';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { TenantProvisioningRepository } from '../../domain/repositories/tenant-provisioning.repository';

/**
 * Implementação Prisma responsável pelo provisionamento atômico
 * de um Tenant e seu membro OWNER.
 *
 * A operação utiliza uma transação para garantir que:
 *
 * 1. o Tenant seja criado;
 * 2. o membro OWNER seja criado;
 * 3. qualquer falha provoque rollback de toda a operação.
 */
@Injectable()
export class PrismaTenantProvisioningRepository implements TenantProvisioningRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOwner(
    tenant: TenantEntity,
    owner: TenantMemberEntity,
  ): Promise<{
    tenant: TenantEntity;
    owner: TenantMemberEntity;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        },
      });

      const createdOwner = await tx.tenantMember.create({
        data: {
          id: owner.id,
          tenantId: owner.tenantId,
          userId: owner.userId,
          role: owner.role,
          status: owner.status,
          createdAt: owner.createdAt,
          updatedAt: owner.updatedAt,
        },
      });

      return {
        tenant: this.toTenantEntity(createdTenant),
        owner: this.toTenantMemberEntity(createdOwner),
      };
    });
  }

  /**
   * Converte o enum retornado pelo Prisma para o enum
   * correspondente da camada de domínio.
   */
  private toTenantStatus(status: PrismaTenantStatus): TenantStatus {
    return status as TenantStatus;
  }

  /**
   * Converte o enum de role retornado pelo Prisma para o
   * enum correspondente da camada de domínio.
   */
  private toTenantRole(role: PrismaTenantRole): TenantRole {
    return role as TenantRole;
  }

  /**
   * Converte o status do membro retornado pelo Prisma para o
   * enum correspondente da camada de domínio.
   */
  private toTenantMemberStatus(
    status: PrismaTenantMemberStatus,
  ): TenantMemberStatus {
    return status as TenantMemberStatus;
  }

  private toTenantEntity(data: {
    id: string;
    name: string;
    slug: string;
    status: PrismaTenantStatus;
    createdAt: Date;
    updatedAt: Date;
  }): TenantEntity {
    return new TenantEntity(
      data.id,
      data.name,
      data.slug,
      this.toTenantStatus(data.status),
      data.createdAt,
      data.updatedAt,
    );
  }

  private toTenantMemberEntity(data: {
    id: string;
    tenantId: string;
    userId: string;
    role: PrismaTenantRole;
    status: PrismaTenantMemberStatus;
    createdAt: Date;
    updatedAt: Date;
  }): TenantMemberEntity {
    return new TenantMemberEntity({
      id: data.id,
      tenantId: data.tenantId,
      userId: data.userId,
      role: this.toTenantRole(data.role),
      status: this.toTenantMemberStatus(data.status),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
