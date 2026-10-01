import { SubscriptionPlanChangeType } from '../enums/subscription-plan-change-type.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';

export class SubscriptionEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public planId: string,
    public status: SubscriptionStatus,
    public readonly startedAt: Date,
    public currentPeriodStart: Date,
    public currentPeriodEnd: Date,
    public trialEndsAt: Date | null,
    public cancelledAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public pendingPlanId: string | null = null,
    public pendingPlanChangeType: SubscriptionPlanChangeType | null = null,
    public pendingPlanEffectiveAt: Date | null = null,
    public pendingPlanInvoiceId: string | null = null,
  ) {}

  get isTrial(): boolean {
    return this.status === SubscriptionStatus.TRIALING;
  }

  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  get isPending(): boolean {
    return this.status === SubscriptionStatus.PENDING;
  }

  get hasPendingPlanChange(): boolean {
    return this.pendingPlanId !== null;
  }

  hasTrialExpired(referenceDate: Date = new Date()): boolean {
    return (
      this.isTrial &&
      this.trialEndsAt !== null &&
      this.trialEndsAt.getTime() <= referenceDate.getTime()
    );
  }

  get hasCommercialAccess(): boolean {
    if (this.isActive) return true;
    if (this.isTrial) return !this.hasTrialExpired();
    return false;
  }

  get isInactive(): boolean {
    return [
      SubscriptionStatus.CANCELLED,
      SubscriptionStatus.EXPIRED,
      SubscriptionStatus.SUSPENDED,
    ].includes(this.status);
  }

  changePlan(planId: string, updatedAt: Date = new Date()): void {
    this.planId = planId;
    this.updatedAt = updatedAt;
  }

  scheduleUpgrade(
    planId: string,
    invoiceId: string,
    effectiveAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): void {
    this.pendingPlanId = planId;
    this.pendingPlanChangeType = SubscriptionPlanChangeType.UPGRADE;
    this.pendingPlanEffectiveAt = effectiveAt;
    this.pendingPlanInvoiceId = invoiceId;
    this.updatedAt = updatedAt;
  }

  scheduleDowngrade(
    planId: string,
    effectiveAt: Date,
    updatedAt: Date = new Date(),
  ): void {
    this.pendingPlanId = planId;
    this.pendingPlanChangeType = SubscriptionPlanChangeType.DOWNGRADE;
    this.pendingPlanEffectiveAt = effectiveAt;
    this.pendingPlanInvoiceId = null;
    this.updatedAt = updatedAt;
  }

  applyPendingPlan(updatedAt: Date = new Date()): void {
    if (this.pendingPlanId === null) {
      return;
    }

    this.planId = this.pendingPlanId;
    this.clearPendingPlanChange(updatedAt);
  }

  clearPendingPlanChange(updatedAt: Date = new Date()): void {
    this.pendingPlanId = null;
    this.pendingPlanChangeType = null;
    this.pendingPlanEffectiveAt = null;
    this.pendingPlanInvoiceId = null;
    this.updatedAt = updatedAt;
  }

  markAsPending(updatedAt: Date = new Date()): void {
    this.status = SubscriptionStatus.PENDING;
    this.cancelledAt = null;
    this.trialEndsAt = null;
    this.updatedAt = updatedAt;
  }

  cancel(cancelledAt: Date = new Date()): void {
    this.status = SubscriptionStatus.CANCELLED;
    this.cancelledAt = cancelledAt;
    this.updatedAt = cancelledAt;
  }

  activate(updatedAt: Date = new Date()): void {
    this.status = SubscriptionStatus.ACTIVE;
    this.cancelledAt = null;
    this.updatedAt = updatedAt;
  }

  markAsPastDue(updatedAt: Date = new Date()): void {
    this.status = SubscriptionStatus.PAST_DUE;
    this.updatedAt = updatedAt;
  }

  suspend(updatedAt: Date = new Date()): void {
    this.status = SubscriptionStatus.SUSPENDED;
    this.updatedAt = updatedAt;
  }

  expire(updatedAt: Date = new Date()): void {
    this.status = SubscriptionStatus.EXPIRED;
    this.updatedAt = updatedAt;
  }
}
