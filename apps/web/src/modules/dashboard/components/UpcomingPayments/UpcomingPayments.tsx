import Link from "next/link";
import type { UpcomingPayment } from "../TenantDashboard/dashboard.types";
import styles from "../TenantDashboard/TenantDashboard.module.scss";

/**
 * Formata os valores dos pagamentos futuros.
 *
 * @param value - Valor numérico.
 * @param currency - Código da moeda.
 * @returns Valor monetário formatado.
 */
function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Apresenta os próximos pagamentos do Espaço ativo.
 *
 * Exibe obrigações financeiras provenientes de
 * parcelas e despesas recorrentes.
 */
export function UpcomingPayments({ upcomingPayments }: {
  upcomingPayments: UpcomingPayment[];
}) {
  return (
<section className={styles.dashboardPanel}>
          <div className={styles.dashboardPanelHeading}>
            <div>
              <h2>Próximas contas</h2>
              <p>Parcelas e recorrências a vencer</p>
            </div>
            <Link href="/dashboard/transactions">Ver todas</Link>
          </div>

          {upcomingPayments.length === 0 ? (
            <p className={styles.dashboardEmpty}>
              Nenhum pagamento futuro encontrado.
            </p>
          ) : (
            <div className={styles.dashboardTransactions}>
              {upcomingPayments.map((payment) => (
                <div className={styles.dashboardTransaction} key={payment.id}>
                  <div>
                    <strong>{payment.title}</strong>
                    <span>
                      Vence em{" "}
                      {new Date(`${payment.dueDate.slice(0, 10)}T12:00:00`)
                        .toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <strong>{formatCurrency(payment.amount, "BRL")}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
  );
}
