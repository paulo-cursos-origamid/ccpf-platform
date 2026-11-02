import { AdminInvoiceDetail } from "@/modules/billing/components";
import { PlatformPermissionAccessGuard } from "@/modules/identity/components/client/PlatformPermissionAccessGuard";
import { PLATFORM_PERMISSIONS } from "@/modules/identity/utils";

interface AdminInvoiceDetailPageProps {
  params: Promise<{
    invoiceId: string;
  }>;
}

export default async function AdminInvoiceDetailPage({
  params,
}: AdminInvoiceDetailPageProps) {
  const { invoiceId } = await params;

  return (
    <PlatformPermissionAccessGuard
      permission={PLATFORM_PERMISSIONS.BILLING_MANAGE}
    >
      <AdminInvoiceDetail invoiceId={invoiceId} />
    </PlatformPermissionAccessGuard>
  );
}
