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

  abstract findActiveByTenant(
    tenantId: string,
  ): Promise<SubscriptionEntity | null>;

  abstract findByTenant(tenantId: string): Promise<SubscriptionEntity[]>;

  abstract update(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity>;
}
