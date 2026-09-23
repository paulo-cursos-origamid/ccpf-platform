import { Injectable } from '@nestjs/common';

import { PlanFeatureCode } from '../../domain/enums/plan-feature-code.enum';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';

/**
 * Serviço responsável por verificar se a assinatura atual
 * de um Tenant possui determinada feature do plano.
 *
 * A resolução da Subscription passa pelo lifecycle para garantir
 * que um Trial expirado seja convertido em EXPIRED antes da decisão.
 */
@Injectable()
export class SubscriptionFeatureAccessService {
  constructor(
    private readonly subscriptionLifecycleService: SubscriptionLifecycleService,
    private readonly planRepository: PlanRepository,
  ) {}

  /**
   * Verifica se o Tenant possui acesso à feature informada.
   *
   * Uma feature somente é liberada quando:
   * - existe uma assinatura comercial utilizável;
   * - o plano continua ativo;
   * - a feature está habilitada no plano.
   */
  async canAccess(
    tenantId: string,
    feature: PlanFeatureCode,
  ): Promise<boolean> {
    const subscription =
      await this.subscriptionLifecycleService.resolveCurrent(tenantId);

    if (!subscription || !subscription.hasCommercialAccess) {
      return false;
    }

    const plan = await this.planRepository.findById(subscription.planId);

    if (!plan || !plan.isActive) {
      return false;
    }

    return plan.hasFeature(feature);
  }
}
