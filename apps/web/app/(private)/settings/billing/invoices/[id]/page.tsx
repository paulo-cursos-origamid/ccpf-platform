import { InvoiceDetails } from "@/modules/billing/components/InvoiceDetails";

interface InvoiceDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Página dinâmica responsável por apresentar os detalhes
 * de uma fatura específica do Billing.
 *
 * A página somente resolve o parâmetro da rota e delega
 * a apresentação para o componente client do módulo Billing.
 */
export default async function InvoiceDetailsPage({
  params,
}: InvoiceDetailsPageProps) {
  const { id } = await params;

  return (
    <main>
      <InvoiceDetails invoiceId={id} />
    </main>
  );
}
