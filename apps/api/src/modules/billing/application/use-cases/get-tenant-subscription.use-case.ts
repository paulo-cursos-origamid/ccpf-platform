import { Injectable } from '@nestjs/common';

import { SubscriptionLifecycleService } from '../services/subscription-lifecycle.service';
import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { PlanFeatureCode } from '../../domain/enums/plan-feature-code.enum';

type SubscriptionPlanDetails = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  maxUsers: number;
  active: boolean;
  features: PlanFeatureCode[];
};

/**
 * Caso de uso responsável por consultar a assinatura vigente
 * de um Tenant.
 *
 * O Tenant é recebido como contexto da aplicação.
 * A resolução e validação desse contexto pertencem à camada
 * de apresentação através do TenantContextGuard.
 */
@Injectable()
export class GetTenantSubscriptionUseCase {
  constructor(
    private readonly subscriptionLifecycleService: SubscriptionLifecycleService,
    private readonly planRepository: PlanRepository,
  ) {}

  /**
   * Retorna a assinatura vigente do Tenant.
   *
   * Caso o Tenant ainda não possua uma assinatura vigente,
   * retorna null.
   */
  async execute(
    tenantId: string,
  ): Promise<
    (SubscriptionEntity & { plan: SubscriptionPlanDetails | null }) | null
  > {
    const subscription =
      await this.subscriptionLifecycleService.resolveCurrent(tenantId);

    if (!subscription) {
      return null;
    }

    const plan = await this.planRepository.findById(subscription.planId);

    return Object.assign(subscription, {
      plan: plan
        ? {
            id: plan.id,
            code: plan.code,
            name: plan.name,
            description: plan.description,
            maxUsers: plan.maxUsers,
            active: plan.isActive,
            features: plan.features,
          }
        : null,
    });
  }
}
