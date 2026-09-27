/**
 * Define o papel de um usuário dentro de um Tenant.
 *
 * Este papel é diferente do UserRole global da plataforma.
 *
 * UserRole:
 *   define permissões globais na plataforma.
 *
 * TenantRole:
 *   define permissões do usuário dentro de um Tenant específico.
 */
export enum TenantRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}
