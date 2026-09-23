import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { SubscriptionFeatureAccessService } from '../../application/services/subscription-feature-access.service';
import { PlanFeatureCode } from '../../domain/enums/plan-feature-code.enum';
import { REQUIRED_PLAN_FEATURE_KEY } from '../decorators/require-feature.decorator';

import type { TenantContext } from '../../../tenant/presentation/interfaces/tenant-context.interface';

type TenantRequest = Request & {
  tenantContext?: TenantContext;
};

/**
 * Guard responsável por aplicar autorização comercial
 * baseada nas features do plano do Tenant.
 *
 * O guard pressupõe que o TenantContextGuard tenha sido executado
 * anteriormente para disponibilizar o TenantContext.
 *
 * A feature é obtida através do metadata criado por @RequireFeature().
 */
@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionFeatureAccessService: SubscriptionFeatureAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<
      PlanFeatureCode | undefined
    >(REQUIRED_PLAN_FEATURE_KEY, [context.getHandler(), context.getClass()]);

    /**
     * Sem @RequireFeature(), o guard não impõe nenhuma restrição.
     */
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();

    const tenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new ForbiddenException('Tenant context not found');
    }

    const hasAccess = await this.subscriptionFeatureAccessService.canAccess(
      tenantContext.tenantId,
      requiredFeature,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `O plano do Tenant não possui acesso ao recurso ${requiredFeature}.`,
      );
    }

    return true;
  }
}
