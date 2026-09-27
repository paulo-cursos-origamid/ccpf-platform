import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { TenantEntity } from '../../domain/entities/tenant.entity';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { TenantRepository } from '../../domain/repositories/tenant.repository';

/**
 * Implementação Prisma do repositório de Tenant.
 *
 * Responsável por traduzir os dados persistidos pelo Prisma
 * para as entidades utilizadas pelo domínio.
 *
 * O repositório não depende dos enums gerados pelo Prisma.
 * O domínio mantém sua própria definição de TenantStatus.
 */
@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo Tenant no banco de dados.
   */
  async create(tenant: TenantEntity): Promise<TenantEntity> {
    const createdTenant = await this.prisma.tenant.create({
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
      },
    });

    return this.toDomain(createdTenant);
  }

  /**
   * Busca um Tenant pelo seu identificador.
   */
  async findById(id: string): Promise<TenantEntity | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id,
      },
    });

    if (!tenant) {
      return null;
    }

    return this.toDomain(tenant);
  }

  /**
   * Busca um Tenant pelo slug.
   */
  async findBySlug(slug: string): Promise<TenantEntity | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug,
      },
    });

    if (!tenant) {
      return null;
    }

    return this.toDomain(tenant);
  }

  /**
   * Atualiza os dados de um Tenant existente.
   */
  async update(tenant: TenantEntity): Promise<TenantEntity> {
    const updatedTenant = await this.prisma.tenant.update({
      where: {
        id: tenant.id,
      },
      data: {
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
      },
    });

    return this.toDomain(updatedTenant);
  }

  /**
   * Converte um registro persistido pelo Prisma
   * para a entidade de domínio TenantEntity.
   */
  private toDomain(rawTenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): TenantEntity {
    return new TenantEntity(
      rawTenant.id,
      rawTenant.name,
      rawTenant.slug,
      rawTenant.status as TenantStatus,
      rawTenant.createdAt,
      rawTenant.updatedAt,
    );
  }
}
