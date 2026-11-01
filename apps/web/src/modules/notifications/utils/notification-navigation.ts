/**
 * Resolve o destino frontend de uma notificação.
 */
export function getNotificationNavigationPath(
  resourceType: string | null,
  resourceId: string | null,
): string | null {
  if (!resourceType) return null;

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

  if (resourceType === "INSTALLMENT" && resourceId) {
    return `/dashboard/transactions?paymentType=INSTALLMENT&paymentResourceId=${encodeURIComponent(resourceId)}`;
  }

  if (resourceType === "RECURRING_BILL_OCCURRENCE" && resourceId) {
    return `/dashboard/transactions?paymentType=RECURRING&paymentResourceId=${encodeURIComponent(resourceId)}`;
  }

  return null;
}
