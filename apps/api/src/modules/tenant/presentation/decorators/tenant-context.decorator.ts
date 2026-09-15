import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { TenantContext } from '../interfaces/tenant-context.interface';

/**
 * Recupera o contexto do Tenant ativo da requisição.
 *
 * O TenantContextGuard é responsável por construir e validar
 * este contexto antes que o controller seja executado.
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext => {
    const request = context.switchToHttp().getRequest<
      Request & {
        tenantContext?: TenantContext;
      }
    >();

    if (!request.tenantContext) {
      throw new UnauthorizedException('Tenant context not found');
    }

    return request.tenantContext;
  },
);
