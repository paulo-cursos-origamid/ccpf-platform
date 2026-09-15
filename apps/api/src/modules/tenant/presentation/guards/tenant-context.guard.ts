import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { TenantMemberStatus } from '../../domain/enums/tenant-member-status.enum';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { TenantMemberRepository } from '../../domain/repositories/tenant-member.repository';
import { TenantRepository } from '../../domain/repositories/tenant.repository';

import { AuthenticatedUser } from '../../../identity/infrastructure/auth';
import { TenantContext } from '../interfaces/tenant-context.interface';

type TenantRequest = Request & {
  user?: AuthenticatedUser;
  tenantContext?: TenantContext;
};

/**
 * Valida e cria o contexto do Tenant ativo da requisição.
 *
 * O Tenant é informado pelo cliente através do header:
 *
 * X-Tenant-Id: <tenant-id>
 *
 * O header não representa autorização por si só.
 *
 * O backend valida:
 * 1. usuário autenticado;
 * 2. Tenant existente;
 * 3. Tenant ativo;
 * 4. vínculo TenantMember entre usuário e Tenant;
 * 5. vínculo com status ACTIVE.
 *
 * Somente depois dessas validações o TenantContext é disponibilizado
 * para os controllers.
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const rawTenantId = request.headers['x-tenant-id'];

    if (typeof rawTenantId !== 'string' || !rawTenantId.trim()) {
      throw new ForbiddenException('X-Tenant-Id header is required');
    }

    const tenantId = rawTenantId.trim();

    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new ForbiddenException('Tenant not found');
    }

    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new ForbiddenException('Tenant is not active');
    }

    const member = await this.tenantMemberRepository.findByTenantAndUser(
      tenantId,
      user.sub,
    );

    if (!member) {
      throw new ForbiddenException('User does not belong to this Tenant');
    }

    if (member.status !== TenantMemberStatus.ACTIVE) {
      throw new ForbiddenException('User access to this Tenant is not active');
    }

    request.tenantContext = {
      tenantId,
      userId: user.sub,
      role: member.role,
    };

    return true;
  }
}
