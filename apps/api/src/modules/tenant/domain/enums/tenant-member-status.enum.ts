/**
 * Define o estado da associação entre um usuário e um Tenant.
 */
export enum TenantMemberStatus {
  ACTIVE = 'ACTIVE',
  INVITED = 'INVITED',
  BLOCKED = 'BLOCKED',
  REMOVED = 'REMOVED',
}
