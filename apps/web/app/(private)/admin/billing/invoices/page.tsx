import { AdminInvoiceList } from "@/modules/billing/components";
import { PlatformPermissionAccessGuard } from "@/modules/identity/components/client/PlatformPermissionAccessGuard";
import { PLATFORM_PERMISSIONS } from "@/modules/identity/utils";

/**
 * Página administrativa responsável pela consulta global
 * das faturas da plataforma.
 *
 * A apresentação fica encapsulada no componente client
 * AdminInvoiceList.
 */
export default function AdminBillingInvoicesPage() {
  return (
    <PlatformPermissionAccessGuard permission={PLATFORM_PERMISSIONS.BILLING_MANAGE}>
      <main>
        <AdminInvoiceList />
      </main>
    </PlatformPermissionAccessGuard>
  );
}
