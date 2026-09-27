import { TenantRole } from '../../domain/enums/tenant-role.enum';

/**
 * Representa o contexto do Tenant ativo durante uma requisição HTTP.
 *
 * O tenantId não pertence ao JWT porque um mesmo usuário pode
 * participar de múltiplos Tenants.
 *
 * O contexto é determinado por:
 * - usuário autenticado pelo JWT;
 * - Tenant informado através do header X-Tenant-Id;
 * - vínculo TenantMember validado pelo backend.
 */
export interface TenantContext {
  tenantId: string;
  userId: string;
  role: TenantRole;
}
