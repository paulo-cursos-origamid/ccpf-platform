import { BillingInterval } from '../../../billing/domain/enums/billing-interval.enum';
import { SubscriptionEntity } from '../../../billing/domain/entities/subscription.entity';
import { TenantMemberEntity } from '../../../tenant/domain/entities/tenant-member.entity';
import { TenantEntity } from '../../../tenant/domain/entities/tenant.entity';
import { UserEntity } from '../entities/user.entity';

/**
 * Dados mínimos do plano TRIAL necessários para o cadastro público.
 *
 * O lookup pertence ao repositório porque o provisionamento completo
 * precisa continuar independente dos módulos Nest de Billing e Tenant.
 */
export interface PublicTrialPlanData {
  id: string;
  billingInterval: BillingInterval;
}

/**
 * Contrato responsável pelo provisionamento completo de um novo
 * cliente SaaS através do cadastro público.
 *
 * A operação precisa ser atômica porque User, Tenant, OWNER e
 * Subscription representam uma única operação de negócio.
 *
 * A implementação concreta pertence à infraestrutura.
 */
export abstract class PublicUserProvisioningRepository {
  abstract findPublicTrialPlan(): Promise<PublicTrialPlanData | null>;

  abstract create(
    user: UserEntity,
    tenant: TenantEntity,
    owner: TenantMemberEntity,
    subscription: SubscriptionEntity,
  ): Promise<{
    user: UserEntity;
    tenant: TenantEntity;
    owner: TenantMemberEntity;
    subscription: SubscriptionEntity;
  }>;
}
