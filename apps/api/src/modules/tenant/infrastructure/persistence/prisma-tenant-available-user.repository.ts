import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import {
  AvailableTenantUser,
  TenantAvailableUserRepository,
} from '../../domain/repositories/tenant-available-user.repository';

/**
 * Implementação Prisma do repositório de usuários disponíveis
 * para associação a um Tenant.
 *
 * Responsável por:
 * - localizar usuários ativos da plataforma;
 * - incluir usuários que nunca tiveram vínculo;
 * - incluir usuários cujo vínculo anterior foi REMOVED;
 * - excluir usuários com vínculo ACTIVE, BLOCKED ou INVITED.
 *
 * Nenhuma regra de autorização é definida aqui.
 */
@Injectable()
export class PrismaTenantAvailableUserRepository implements TenantAvailableUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableByTenant(
    tenantId: string,
  ): Promise<AvailableTenantUser[]> {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,

        OR: [
          {
            tenantMembers: {
              none: {
                tenantId,
              },
            },
          },
          {
            tenantMembers: {
              some: {
                tenantId,
                status: 'REMOVED',
              },
            },
          },
        ],
      },

      select: {
        id: true,
        name: true,
        email: true,
      },

      orderBy: [
        {
          name: 'asc',
        },
        {
          email: 'asc',
        },
      ],
    });
  }
}
