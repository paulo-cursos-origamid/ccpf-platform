import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

import { SubscriptionLifecycleService } from '../../application/services/subscription-lifecycle.service';
import type { TenantContext } from '../../../tenant/presentation/interfaces/tenant-context.interface';

type TenantRequest = Request & {
  tenantContext?: TenantContext;
};

/**
 * Guarda responsável por impedir o acesso aos recursos comerciais
 * quando o Tenant não possui uma assinatura que permita utilização.
 *
 * O TenantContextGuard já validou:
 * - usuário autenticado;
 * - Tenant existente e ativo;
 * - vínculo do usuário com o Tenant.
 *
 * Este guard trata exclusivamente do estado comercial da assinatura.
 */
@Injectable()
export class SubscriptionAccessGuard implements CanActivate {
  constructor(
    private readonly subscriptionLifecycleService: SubscriptionLifecycleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    const tenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new ForbiddenException('Tenant context not found');
    }

    const subscription = await this.subscriptionLifecycleService.resolveCurrent(
      tenantContext.tenantId,
    );

    if (!subscription) {
      throw new ForbiddenException(
        'O Tenant não possui uma assinatura comercial disponível.',
      );
    }

    if (!subscription.hasCommercialAccess) {
      throw new ForbiddenException(
        'A assinatura do Tenant não permite acesso aos recursos comerciais.',
      );
    }

    return true;
  }
}
