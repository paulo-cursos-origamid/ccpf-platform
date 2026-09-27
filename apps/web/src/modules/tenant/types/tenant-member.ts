import type { TenantMemberStatus } from "./tenant-member-status";
import type { TenantRole } from "./tenant-role";

/**
 * Representa um membro de um Tenant.
 *
 * O vínculo, papel e status pertencem ao domínio Tenant.
 * Os dados de identidade (name e email) são fornecidos pelo
 * domínio Identity através da resposta consolidada da API.
 */
export interface TenantMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: TenantRole;
  status: TenantMemberStatus;
  createdAt: string;
  updatedAt: string;
}
