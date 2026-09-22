import { TenantMemberEntity } from '../entities/tenant-member.entity';
import { TenantEntity } from '../entities/tenant.entity';

/**
 * Contrato responsável pelo provisionamento inicial de um Tenant.
 *
 * A criação do Tenant e do seu membro OWNER precisa ser atômica,
 * pois representam uma única operação de negócio.
 */
export abstract class TenantProvisioningRepository {
  abstract createWithOwner(
    tenant: TenantEntity,
    owner: TenantMemberEntity,
  ): Promise<{
    tenant: TenantEntity;
    owner: TenantMemberEntity;
  }>;
}
