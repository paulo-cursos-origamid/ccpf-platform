/**
 * Define o contrato utilizado pelo domínio Tenant
 * para consultar os limites comerciais aplicáveis
 * ao Tenant.
 *
 * O domínio Tenant não conhece Plan, Subscription
 * nem qualquer detalhe de persistência do Billing.
 */
export abstract class TenantPlanLimitsRepository {
  /**
   * Retorna o limite de usuários permitido pela
   * assinatura vigente do Tenant.
   *
   * - número positivo: quantidade máxima de usuários;
   * - -1: quantidade ilimitada;
   * - null: Tenant sem assinatura utilizável.
   */
  abstract findMaxUsersByTenant(tenantId: string): Promise<number | null>;

  /**
   * Retorna o limite de Tenants do plano associado à assinatura
   * utilizável de um Tenant em que o usuário é OWNER.
   */
  abstract findMaxTenantsByUser(userId: string): Promise<number | null>;

  /**
   * Conta os Tenants em que o usuário possui vínculo OWNER ativo.
   */
  abstract countOwnedTenantsByUser(userId: string): Promise<number>;
}
