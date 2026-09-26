import { SubscriptionEntity } from '../entities/subscription.entity';

/**
 * Define o contrato de persistência do domínio Subscription.
 *
 * A implementação concreta pertence à infraestrutura.
 */
export abstract class SubscriptionRepository {
  abstract create(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity>;

  abstract findById(id: string): Promise<SubscriptionEntity | null>;

  /**
   * Retorna a assinatura corrente do Tenant.
   *
   * São consideradas correntes as assinaturas que ainda
   * representam um ciclo comercial não encerrado:
   *
   * - PENDING
   * - TRIALING
   * - ACTIVE
   * - PAST_DUE
   * - SUSPENDED
   */
  abstract findCurrentByTenant(
    tenantId: string,
  ): Promise<SubscriptionEntity | null>;

  abstract findByTenant(tenantId: string): Promise<SubscriptionEntity[]>;

  abstract update(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity>;
}
