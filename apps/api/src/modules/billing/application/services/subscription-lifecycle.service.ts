import { Injectable } from '@nestjs/common';

import { BillingDateService } from '../../domain/services/billing-date.service';
import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionPlanChangeType } from '../../domain/enums/subscription-plan-change-type.enum';
import { PlanPriceRepository } from '../../domain/repositories/plan-price.repository';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

/**
 * Resolve o estado comercial vigente da assinatura.
 *
 * Responsabilidade:
 * - localizar a assinatura corrente;
 * - refletir em memória transições de lifecycle que já venceram;
 * - nunca persistir alterações.
 *
 * A persistência das transições financeiras é responsabilidade do
 * SubscriptionLifecycleApplicationService, sempre dentro de um UoW.
 */
@Injectable()
export class SubscriptionLifecycleService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
    private readonly planPriceRepository: PlanPriceRepository,
    private readonly billingDateService: BillingDateService,
  ) {}

  async resolveCurrent(tenantId: string): Promise<SubscriptionEntity | null> {
    const subscription =
      await this.subscriptionRepository.findCurrentByTenant(tenantId);

    if (!subscription) {
      return null;
    }

    const now = new Date();

    if (subscription.hasTrialExpired(now)) {
      return null;
    }

    await this.applyScheduledDowngradeInMemory(subscription, now);

    return subscription;
  }

  /**
   * Aplica transições vencidas somente em memória.
   *
   * Este método é usado por operações de leitura para que guards e consultas
   * enxerguem o estado comercial efetivo sem produzir efeitos colaterais.
   */
  async applyDueTransitionsInMemory(
    subscription: SubscriptionEntity,
    referenceDate: Date = new Date(),
  ): Promise<SubscriptionEntity | null> {
    if (subscription.hasTrialExpired(referenceDate)) {
      return null;
    }

    await this.applyScheduledDowngradeInMemory(subscription, referenceDate);

    return subscription;
  }

  private async applyScheduledDowngradeInMemory(
    subscription: SubscriptionEntity,
    referenceDate: Date,
  ): Promise<void> {
    if (
      !subscription.hasPendingPlanChange ||
      subscription.pendingPlanChangeType !==
        SubscriptionPlanChangeType.DOWNGRADE ||
      !subscription.pendingPlanEffectiveAt
    ) {
      return;
    }

    if (
      subscription.pendingPlanEffectiveAt.getTime() > referenceDate.getTime()
    ) {
      return;
    }

    if (!subscription.pendingPlanId || !subscription.pendingPlanPriceId) {
      return;
    }

    const targetPlan = await this.planRepository.findById(
      subscription.pendingPlanId,
    );

    if (!targetPlan || !targetPlan.isActive || !targetPlan.isPublic) {
      return;
    }

    const targetPlanPrice = await this.planPriceRepository.findById(
      subscription.pendingPlanPriceId,
    );

    if (
      !targetPlanPrice ||
      !targetPlanPrice.isActive ||
      targetPlanPrice.planId !== targetPlan.id
    ) {
      return;
    }

    const previousPeriodEnd = subscription.currentPeriodEnd;

    const currentPeriodStart =
      previousPeriodEnd.getTime() > referenceDate.getTime()
        ? previousPeriodEnd
        : referenceDate;

    const billingDay = this.billingDateService.validateBillingDayForInterval(
      subscription.pendingBillingDay ?? undefined,
      targetPlanPrice.interval,
    );

    const currentPeriodEnd =
      this.billingDateService.calculatePeriodEnd(
        currentPeriodStart,
        targetPlanPrice.interval,
        billingDay,
      ) ?? currentPeriodStart;

    const nextBillingDate = this.billingDateService.calculateNextBillingDate(
      currentPeriodStart,
      billingDay,
      targetPlanPrice.interval,
    );

    subscription.applyPendingPlan(
      billingDay,
      nextBillingDate,
      currentPeriodStart,
      currentPeriodEnd,
      referenceDate,
    );
  }
}
