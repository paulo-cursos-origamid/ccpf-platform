import { TenantEntity } from '../entities/tenant.entity';

/**
 * Define o contrato de persistência do domínio Tenant.
 *
 * A camada de domínio não conhece Prisma, PostgreSQL ou qualquer
 * tecnologia de persistência.
 *
 * A implementação concreta deste contrato ficará na camada
 * de infraestrutura.
 */
export abstract class TenantRepository {
  abstract create(tenant: TenantEntity): Promise<TenantEntity>;

  abstract findById(id: string): Promise<TenantEntity | null>;

  abstract findBySlug(slug: string): Promise<TenantEntity | null>;

  abstract update(tenant: TenantEntity): Promise<TenantEntity>;
}
