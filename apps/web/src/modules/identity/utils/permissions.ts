/**
 * Permissões globais disponíveis para usuários administrativos
 * da plataforma CCPF.
 *
 * O frontend utiliza esses códigos apenas para controlar a interface.
 * A autorização real permanece no backend através do
 * PlatformPermissionGuard.
 */
export const PLATFORM_PERMISSIONS = {
  USERS_READ: "USERS_READ",
  USERS_CREATE: "USERS_CREATE",
  USERS_UPDATE: "USERS_UPDATE",
  USERS_DELETE: "USERS_DELETE",

  TENANTS_READ: "TENANTS_READ",
  TENANTS_CREATE: "TENANTS_CREATE",
  TENANTS_UPDATE: "TENANTS_UPDATE",

  PLANS_READ: "PLANS_READ",
  PLANS_CREATE: "PLANS_CREATE",
  PLANS_UPDATE: "PLANS_UPDATE",

  SUBSCRIPTIONS_READ: "SUBSCRIPTIONS_READ",
  SUBSCRIPTIONS_UPDATE: "SUBSCRIPTIONS_UPDATE",

  BILLING_READ: "BILLING_READ",
  BILLING_MANAGE: "BILLING_MANAGE",

  DASHBOARD_READ: "DASHBOARD_READ",
} as const;

export type PlatformPermission =
  (typeof PLATFORM_PERMISSIONS)[keyof typeof PLATFORM_PERMISSIONS];

/**
 * Verifica se uma lista de permissões contém a permissão solicitada.
 */
export function hasPermission(
  permissions: readonly string[] | null | undefined,
  permission: PlatformPermission,
): boolean {
  return permissions?.includes(permission) ?? false;
}

/**
 * Verifica se o usuário possui pelo menos uma das permissões informadas.
 */
export function hasAnyPermission(
  permissions: readonly string[] | null | undefined,
  requiredPermissions: readonly PlatformPermission[],
): boolean {
  if (!permissions?.length || !requiredPermissions.length) {
    return false;
  }

  return requiredPermissions.some((permission) =>
    hasPermission(permissions, permission),
  );
}
