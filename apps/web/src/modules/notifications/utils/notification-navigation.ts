/**
 * Resolve o destino frontend de uma notificação.
 *
 * O backend informa apenas resourceType/resourceId.
 * Este módulo mantém o conhecimento das rotas frontend
 * concentrado dentro do domínio de notificações.
 */
export function getNotificationNavigationPath(
  resourceType: string | null,
  resourceId: string | null,
): string | null {
  if (!resourceType) {
    return null;
  }

  if (resourceType === "INVOICE" && resourceId) {
    return `/admin/billing/invoices/${resourceId}`;
  }

  if (resourceType === "ACCOUNT" && resourceId) {
    return `/dashboard/accounts/${resourceId}`;
  }

  if (resourceType === "USER") {
    return "/dashboard/users";
  }

  if (resourceType === "TENANT") {
    return "/dashboard";
  }

  return null;
}
