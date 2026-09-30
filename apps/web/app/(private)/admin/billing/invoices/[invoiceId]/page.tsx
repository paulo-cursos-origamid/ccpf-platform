import { AdminInvoiceDetail } from "@/modules/billing/components";

interface AdminInvoiceDetailPageProps {
  params: Promise<{
    invoiceId: string;
  }>;
}

export default async function AdminInvoiceDetailPage({
  params,
}: AdminInvoiceDetailPageProps) {
  const { invoiceId } = await params;

  return <AdminInvoiceDetail invoiceId={invoiceId} />;
}
