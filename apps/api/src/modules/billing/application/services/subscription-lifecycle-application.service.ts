import { Injectable } from '@nestjs/common';

import { BillingUnitOfWorkContext } from '../../domain/repositories/billing-unit-of-work';
import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionPlanChangeType } from '../../domain/enums/subscription-plan-change-type.enum';
import { BillingDateService } from '../../domain/services/billing-date.service';

/**
 * Responsável pela aplicação persistente das transições de lifecycle.
 *
 * Todas as alterações executadas por este serviço devem ocorrer através
 * dos repositórios pertencentes ao BillingUnitOfWork da operação financeira.
 */
@Injectable()
export class SubscriptionLifecycleApplicationService {
  constructor(private readonly billingDateService: BillingDateService) {}

  async synchronize(
    tenantId: string,
    context: BillingUnitOfWorkContext,
    referenceDate: Date = new Date(),
  ): Promise<SubscriptionEntity | null> {
    const subscription =
      await context.subscriptionRepository.findCurrentByTenant(tenantId);

    if (!subscription) {
      return null;
    }

    if (subscription.hasTrialExpired(referenceDate)) {
      subscription.expire(referenceDate);
      await context.subscriptionRepository.update(subscription);

      /*
       * A assinatura foi efetivamente expirada e, portanto,
       * deixou de ser uma assinatura corrente.
       */
      return null;
    }

    const changed = await this.applyScheduledDowngrade(
      subscription,
      context,
      referenceDate,
    );

    if (!changed) {
      return subscription;
    }

    return context.subscriptionRepository.update(subscription);
  }

  private async applyScheduledDowngrade(
    subscription: SubscriptionEntity,
    context: BillingUnitOfWorkContext,
    referenceDate: Date,
  ): Promise<boolean> {
    if (
      !subscription.hasPendingPlanChange ||
      subscription.pendingPlanChangeType !==
        SubscriptionPlanChangeType.DOWNGRADE ||
      !subscription.pendingPlanEffectiveAt
    ) {
      return false;
    }

    if (
      subscription.pendingPlanEffectiveAt.getTime() > referenceDate.getTime()
    ) {
      return false;
    }

    if (!subscription.pendingPlanId || !subscription.pendingPlanPriceId) {
      return false;
    }

    const targetPlan = await context.planRepository.findById(
      subscription.pendingPlanId,
    );

    if (!targetPlan || !targetPlan.isActive || !targetPlan.isPublic) {
      return false;
    }

    const targetPlanPrice = await context.planPriceRepository.findById(
      subscription.pendingPlanPriceId,
    );

    if (
      !targetPlanPrice ||
      !targetPlanPrice.isActive ||
      targetPlanPrice.planId !== targetPlan.id
    ) {
      return false;
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

    return true;
  }
}
