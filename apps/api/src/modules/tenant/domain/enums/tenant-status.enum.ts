/**
 * Define os estados possíveis de um Tenant dentro da plataforma.
 *
 * ACTIVE:
 * Tenant operacional e com acesso normal à plataforma.
 *
 * SUSPENDED:
 * Tenant temporariamente bloqueado, normalmente por regras
 * administrativas ou situação de cobrança.
 *
 * CANCELLED:
 * Tenant que encerrou sua utilização da plataforma.
 */
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}
