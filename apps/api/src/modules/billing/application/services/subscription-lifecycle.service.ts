import { Injectable } from '@nestjs/common';

import { PlanRepository } from '../../domain/repositories/plan.repository';
import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionPlanChangeType } from '../../domain/enums/subscription-plan-change-type.enum';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

@Injectable()
export class SubscriptionLifecycleService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
  ) {}

  async resolveCurrent(tenantId: string): Promise<SubscriptionEntity | null> {
    const subscription =
      await this.subscriptionRepository.findCurrentByTenant(tenantId);

    if (!subscription) return null;

    const now = new Date();

    if (subscription.hasTrialExpired(now)) {
      subscription.expire(now);
      await this.subscriptionRepository.update(subscription);

      return null;
    }

    await this.applyScheduledDowngrade(subscription, now);

    return subscription;
  }

  private async applyScheduledDowngrade(
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

    if (!subscription.pendingPlanId) {
      return;
    }

    const targetPlan = await this.planRepository.findById(
      subscription.pendingPlanId,
    );

    if (!targetPlan || !targetPlan.isActive || !targetPlan.isPublic) {
      return;
    }

    const previousPeriodEnd = subscription.currentPeriodEnd;

    subscription.applyPendingPlan(referenceDate);

    subscription.currentPeriodStart = previousPeriodEnd;
    subscription.currentPeriodEnd = this.calculatePeriodEnd(
      referenceDate,
      targetPlan.billingInterval,
    );

    await this.subscriptionRepository.update(subscription);
  }

  private calculatePeriodEnd(start: Date, billingInterval: string): Date {
    const end = new Date(start);

    if (billingInterval === 'YEARLY') {
      end.setFullYear(end.getFullYear() + 1);
      return end;
    }

    end.setMonth(end.getMonth() + 1);
    return end;
  }
}
