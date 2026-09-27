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
}
