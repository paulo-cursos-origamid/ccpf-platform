import { ListFinancialObligations } from "@/modules/accounts-payable-receivable";

/** Rota do dashboard privado para compromissos a pagar e receber. */
export default function AccountsPayableReceivablePage() {
  return (
    <main>
      <ListFinancialObligations />
    </main>
  );
}
