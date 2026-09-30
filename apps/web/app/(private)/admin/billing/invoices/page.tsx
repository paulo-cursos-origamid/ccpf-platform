import { AdminInvoiceList } from "@/modules/billing/components";

/**
 * Página administrativa responsável pela consulta global
 * das faturas da plataforma.
 *
 * A apresentação fica encapsulada no componente client
 * AdminInvoiceList.
 */
export default function AdminBillingInvoicesPage() {
  return (
    <main>
      <AdminInvoiceList />
    </main>
  );
}
