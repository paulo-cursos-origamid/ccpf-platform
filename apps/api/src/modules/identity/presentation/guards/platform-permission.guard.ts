import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { PLATFORM_PERMISSION_KEY } from '../decorators/platform-permission.decorator';

import { PlatformAuthorizationRepository } from '../../domain/repositories/platform-authorization.repository';
import type { AuthenticatedUser } from '../../infrastructure/auth';

/**
 * Guard responsável pela autorização global da plataforma.
 *
 * Fluxo:
 * 1. Lê a permissão exigida pelo endpoint.
 * 2. Obtém o usuário autenticado pelo JwtAuthGuard.
 * 3. Consulta as PlatformRoles do usuário.
 * 4. Verifica se alguma role possui a permissão.
 * 5. Permite ou bloqueia a operação.
 *
 * Este guard não substitui o RolesGuard neste momento.
 * A migração será feita gradualmente.
 */
@Injectable()
export class PlatformPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationRepository: PlatformAuthorizationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PLATFORM_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Endpoint sem permissão declarada não precisa deste mecanismo.
    if (!requiredPermission) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authenticated user not found');
    }

    const hasPermission = await this.authorizationRepository.userHasPermission(
      user.sub,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient platform permissions');
    }

    return true;
  }
}
