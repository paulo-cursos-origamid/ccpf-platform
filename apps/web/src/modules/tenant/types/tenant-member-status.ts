/**
 * Define os estados possíveis de um membro dentro de um Tenant.
 *
 * O conjunto de valores deve permanecer alinhado ao enum
 * TenantMemberStatus definido no backend.
 */
export type TenantMemberStatus =
  | "ACTIVE"
  | "INVITED"
  | "BLOCKED"
  | "REMOVED";
