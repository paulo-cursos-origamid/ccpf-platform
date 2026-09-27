import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { PlatformAuthorizationRepository } from '../../domain/repositories/platform-authorization.repository';

/**
 * Implementação Prisma do contrato de autorização da plataforma.
 *
 * Responsabilidade:
 * - Consultar as PlatformRoles vinculadas ao usuário.
 * - Verificar se alguma dessas roles possui a permissão solicitada.
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
}
