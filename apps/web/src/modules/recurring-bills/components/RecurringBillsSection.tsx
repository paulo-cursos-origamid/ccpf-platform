"use client";

import { RecurringBillsRows } from "./RecurringBillsRows";
import styles from "@/modules/transactions/components/client/TransactionsPage.module.scss";

interface RecurringBillsSectionProps {
  search?: string;
  onPayment?: () => void;
}

export function RecurringBillsSection({
  search = "",
  onPayment,
}: RecurringBillsSectionProps) {
  return (
    <section
      className={styles.recurringSection}
      aria-labelledby="recurring-bills-title"
    >
      <header className={styles.recurringSectionHeader}>
        <div>
          <h2 id="recurring-bills-title">
            Contas recorrentes
          </h2>

          <p>
            Organize despesas periódicas e acompanhe os próximos pagamentos.
          </p>
        </div>
      </header>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Próximo vencimento</th>
              <th>Conta</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th className={styles.amount}>
                Valor previsto
              </th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            <RecurringBillsRows
              search={search}
              onPayment={onPayment ?? (() => undefined)}
            />
          </tbody>
        </table>
      </div>
    </section>
  );
}
