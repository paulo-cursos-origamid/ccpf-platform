import { Injectable } from '@nestjs/common';

import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

/**
 * Serviço responsável por resolver o estado atual da assinatura de um Tenant.
 *
 * Centraliza regras de ciclo de vida que precisam acontecer durante
 * uma consulta de Billing, evitando que cada consumidor implemente
 * sua própria interpretação de trial e expiração.
 */
@Injectable()
export class SubscriptionLifecycleService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  /**
   * Retorna a assinatura corrente do Tenant.
   *
   * Quando uma assinatura TRIALING já ultrapassou trialEndsAt,
   * ela é marcada como EXPIRED e deixa de ser considerada corrente.
   */
  async resolveCurrent(tenantId: string): Promise<SubscriptionEntity | null> {
    const subscription =
      await this.subscriptionRepository.findCurrentByTenant(tenantId);

    if (!subscription) {
      return null;
    }

    if (subscription.hasTrialExpired()) {
      const now = new Date();

      subscription.expire(now);

      await this.subscriptionRepository.update(subscription);

      return null;
    }

    return subscription;
  }
}
