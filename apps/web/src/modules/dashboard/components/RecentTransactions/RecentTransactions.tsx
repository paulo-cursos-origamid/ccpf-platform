import Link from "next/link";
import type { DashboardFinancial } from "../TenantDashboard/dashboard.types";
import styles from "../TenantDashboard/TenantDashboard.module.scss";

/**
 * Formata valores monetários das movimentações.
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
 * Apresenta as movimentações financeiras recentes.
 *
 * Exibe os registros fornecidos pelo resumo financeiro
 * e trata os estados de carregamento e erro.
 */
export function RecentTransactions({ financialLoading, transactionsError, financial }: {
  financialLoading: boolean;
  transactionsError: boolean;
  financial: DashboardFinancial;
}) {
  return (
<section className={styles.dashboardPanel}>
          <div className={styles.dashboardPanelHeading}>
            <div>
              <h2>Movimentações recentes</h2>
              <p>Últimas receitas e despesas registradas</p>
            </div>
            <Link href="/dashboard/transactions">Ver todas</Link>
          </div>

          {financialLoading ? (
            <p className={styles.dashboardEmpty}>Carregando movimentações...</p>
          ) : transactionsError ? (
            <p className={styles.dashboardEmpty}>Movimentações indisponíveis.</p>
          ) : financial.recent.length === 0 ? (
            <p className={styles.dashboardEmpty}>
              Nenhuma movimentação registrada.
            </p>
          ) : (
            <div className={styles.dashboardTransactions}>
              {financial.recent.map((item) => (
                <div className={styles.dashboardTransaction} key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {new Date(`${item.date.slice(0, 10)}T12:00:00`)
                        .toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <strong
                    className={
                      item.type === "INCOME"
                        ? styles.positive
                        : styles.negative
                    }
                  >
                    {item.type === "INCOME" ? "+" : "−"}
                    {formatCurrency(Number(item.amount), "BRL")}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
  );
}
