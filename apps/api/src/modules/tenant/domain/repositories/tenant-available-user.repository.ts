/**
 * Representação mínima de um usuário que pode ser associado
 * a um Tenant.
 *
 * Somente os dados necessários para a seleção do usuário
 * são expostos.
 */
export interface AvailableTenantUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Contrato de persistência para consulta de usuários
 * disponíveis para associação a um Tenant.
 *
 * O domínio Tenant define o contrato sem conhecer Prisma
 * ou qualquer detalhe de infraestrutura.
 */
export abstract class TenantAvailableUserRepository {
  /**
   * Lista usuários ativos da plataforma que ainda não
   * possuem vínculo com o Tenant informado.
   */
  abstract findAvailableByTenant(
    tenantId: string,
  ): Promise<AvailableTenantUser[]>;
}
