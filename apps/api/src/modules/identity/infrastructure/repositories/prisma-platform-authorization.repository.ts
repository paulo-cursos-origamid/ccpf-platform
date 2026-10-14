import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { PlatformAuthorizationRepository } from '../../domain/repositories/platform-authorization.repository';

/**
 * Implementação Prisma do contrato de autorização da plataforma.
 *
 * Responsabilidade:
 * - Consultar as PlatformRoles vinculadas ao usuário.
 * - Verificar se alguma dessas roles possui uma permissão específica.
 * - Retornar as permissões efetivas das PlatformRoles ativas do usuário.
 */
@Injectable()
export class PrismaPlatformAuthorizationRepository implements PlatformAuthorizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async userHasPermission(
    userId: string,
    permissionCode: string,
  ): Promise<boolean> {
    const permission = await this.prisma.platformPermission.findUnique({
      where: {
        code: permissionCode,
      },
      select: {
        id: true,
      },
    });

    if (!permission) {
      return false;
    }

    const rolePermission = await this.prisma.platformRolePermission.findFirst({
      where: {
        permissionId: permission.id,
        role: {
          isActive: true,
          users: {
            some: {
              userId,
            },
          },
        },
      },
      select: {
        roleId: true,
      },
    });

    return rolePermission !== null;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const rolePermissions = await this.prisma.platformRolePermission.findMany({
      where: {
        role: {
          isActive: true,
          users: {
            some: {
              userId,
            },
          },
        },
      },
      select: {
        permission: {
          select: {
            code: true,
          },
        },
      },
    });

    return [
      ...new Set(rolePermissions.map(({ permission }) => permission.code)),
    ].sort();
  }
}
