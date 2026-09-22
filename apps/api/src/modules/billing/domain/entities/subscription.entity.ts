import { SubscriptionStatus } from '../enums/subscription-status.enum';

/**
 * Representa uma assinatura de um Tenant a um plano comercial.
 *
 * A entidade controla o estado da assinatura dentro do domínio.
 */
export class SubscriptionEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly planId: string,
    public status: SubscriptionStatus,
    public readonly startedAt: Date,
    public currentPeriodStart: Date,
    public currentPeriodEnd: Date,
    public trialEndsAt: Date | null,
    public cancelledAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  /**
   * Indica se a assinatura está em período de avaliação.
   */
  get isTrial(): boolean {
    return this.status === SubscriptionStatus.TRIALING;
  }

  /**
   * Indica se a assinatura está ativa.
   */
  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  /**
   * Indica se a assinatura está aguardando confirmação
   * de pagamento.
   */
  get isPending(): boolean {
    return this.status === SubscriptionStatus.PENDING;
  }

  /**
   * Indica se a assinatura não deve mais permitir utilização
   * normal dos recursos do plano.
   */
  get isInactive(): boolean {
    return [
      SubscriptionStatus.CANCELLED,
      SubscriptionStatus.EXPIRED,
      SubscriptionStatus.SUSPENDED,
    ].includes(this.status);
  }

  /**
   * Cancela a assinatura.
   */
  cancel(cancelledAt: Date = new Date()): void {
    this.status = SubscriptionStatus.CANCELLED;
    this.cancelledAt = cancelledAt;
    this.updatedAt = cancelledAt;
  }

  /**
   * Ativa a assinatura após confirmação do pagamento.
   */
  activate(updatedAt: Date = new Date()): void {
    this.status = SubscriptionStatus.ACTIVE;
    this.cancelledAt = null;
    this.updatedAt = updatedAt;
  }

  /**
   * Coloca a assinatura em atraso.
   */
  markAsPastDue(updatedAt: Date = new Date()): void {
    this.status = SubscriptionStatus.PAST_DUE;
    this.updatedAt = updatedAt;
  }

  /**
   * Suspende a assinatura.
   */
  suspend(updatedAt: Date = new Date()): void {
    this.status = SubscriptionStatus.SUSPENDED;
    this.updatedAt = updatedAt;
  }

  /**
   * Expira a assinatura.
   */
  expire(updatedAt: Date = new Date()): void {
    this.status = SubscriptionStatus.EXPIRED;
    this.updatedAt = updatedAt;
  }
}
