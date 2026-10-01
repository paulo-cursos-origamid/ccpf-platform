import { BillingInterval } from '../../../billing/domain/enums/billing-interval.enum';
import { InvoiceEntity } from '../../../billing/domain/entities/invoice.entity';
import { SubscriptionEntity } from '../../../billing/domain/entities/subscription.entity';
import { TenantMemberEntity } from '../../../tenant/domain/entities/tenant-member.entity';
import { TenantEntity } from '../../../tenant/domain/entities/tenant.entity';
import { UserEntity } from '../entities/user.entity';

/**
 * Dados do plano público necessários para o cadastro.
 *
 * O lookup pertence ao repositório porque o provisionamento completo
 * precisa continuar independente dos módulos Nest de Billing e Tenant.
 */
export interface PublicPlanData {
  id: string;
  code: string;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
}

/**
 * Contrato responsável pelo provisionamento completo de um novo
 * cliente SaaS através do cadastro público.
 *
 * A operação precisa ser atômica porque User, Tenant, OWNER,
 * Subscription e, quando aplicável, Invoice representam uma única
 * operação de negócio.
 *
 * A implementação concreta pertence à infraestrutura.
 */
export abstract class PublicUserProvisioningRepository {
  abstract findPublicPlan(planCode: string): Promise<PublicPlanData | null>;

  abstract create(
    user: UserEntity,
    tenant: TenantEntity,
    owner: TenantMemberEntity,
    subscription: SubscriptionEntity,
    invoice: InvoiceEntity | null,
  ): Promise<{
    user: UserEntity;
    tenant: TenantEntity;
    owner: TenantMemberEntity;
    subscription: SubscriptionEntity;
    invoice: InvoiceEntity | null;
  }>;
}
