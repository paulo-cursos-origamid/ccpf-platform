import { TenantMemberEntity } from '../entities/tenant-member.entity';

/**
 * Define o contrato de persistência da associação
 * entre usuários e Tenants.
 *
 * O domínio não conhece Prisma ou qualquer tecnologia
 * de persistência.
 */
export abstract class TenantMemberRepository {
  abstract create(member: TenantMemberEntity): Promise<TenantMemberEntity>;

  abstract findByTenantAndUser(
    tenantId: string,
    userId: string,
  ): Promise<TenantMemberEntity | null>;

  abstract findByUser(userId: string): Promise<TenantMemberEntity[]>;

  abstract findByTenant(tenantId: string): Promise<TenantMemberEntity[]>;

  abstract update(member: TenantMemberEntity): Promise<TenantMemberEntity>;
}
