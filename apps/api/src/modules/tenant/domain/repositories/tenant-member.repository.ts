import { TenantMemberEntity } from '../entities/tenant-member.entity';

/**
 * Contrato de persistência para associações
 * entre usuários e Tenants.
 *
 * A camada de domínio define somente as operações
 * necessárias, sem conhecer Prisma ou infraestrutura.
 */
export abstract class TenantMemberRepository {
  /**
   * Persiste uma nova associação entre usuário e Tenant.
   */
  abstract create(member: TenantMemberEntity): Promise<TenantMemberEntity>;

  /**
   * Busca uma associação pelo seu identificador.
   */
  abstract findById(id: string): Promise<TenantMemberEntity | null>;

  /**
   * Busca uma associação entre um usuário e um Tenant.
   */
  abstract findByTenantAndUser(
    tenantId: string,
    userId: string,
  ): Promise<TenantMemberEntity | null>;

  /**
   * Lista todos os Tenants aos quais um usuário está associado.
   */
  abstract findByUser(userId: string): Promise<TenantMemberEntity[]>;

  /**
   * Lista todos os usuários associados a um Tenant.
   */
  abstract findByTenant(tenantId: string): Promise<TenantMemberEntity[]>;

  /**
   * Conta os membros que ocupam vagas no Tenant.
   *
   * Membros REMOVED não devem consumir o limite
   * de usuários do plano.
   */
  abstract countByTenant(tenantId: string): Promise<number>;

  /**
   * Atualiza uma associação existente.
   */
  abstract update(member: TenantMemberEntity): Promise<TenantMemberEntity>;
}
