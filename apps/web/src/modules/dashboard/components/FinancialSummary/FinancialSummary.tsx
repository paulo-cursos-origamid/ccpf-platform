import { Wallet, CircleDollarSign, CreditCard, Coins } from "@/components/icons";
import type { DashboardFinancial } from "../TenantDashboard/dashboard.types";
import styles from "../TenantDashboard/TenantDashboard.module.scss";

/**
 * Formata um valor monetário para apresentação.
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
 * Apresenta o resumo financeiro do Espaço ativo.
 *
 * Exibe saldo consolidado, receitas e despesas,
 * respeitando os estados de carregamento e erro.
 */
export function FinancialSummary({ loading, totalBalance, financialLoading, transactionsError, financial }: {
  loading: boolean;
  totalBalance: number;
  financialLoading: boolean;
  transactionsError: boolean;
  financial: DashboardFinancial;
}) {
  return (
<section className={styles.dashboardMetrics} aria-label="Indicadores financeiros">
        <article className={styles.dashboardMetric}>
          <div className={`${styles.metricIcon} ${styles.metricBalance}`} aria-hidden="true"><Wallet size={20} /></div>
          <span className={styles.metricLabel}>Saldo total</span>
          <strong>
            {loading ? "..." : formatCurrency(totalBalance, "BRL")}
          </strong>
          <small>Contas ativas em reais</small>
        </article>

        <article className={styles.dashboardMetric}>
          <div className={`${styles.metricIcon} ${styles.metricIncome}`} aria-hidden="true"><CircleDollarSign size={20} /></div>
          <span className={styles.metricLabel}>Receitas do mês</span>
          <strong className={styles.positive}>
            {financialLoading || transactionsError
              ? "—"
              : formatCurrency(financial.income, "BRL")}
          </strong>
          <small>Entradas registradas</small>
        </article>

        <article className={styles.dashboardMetric}>
          <div className={`${styles.metricIcon} ${styles.metricExpense}`} aria-hidden="true"><CreditCard size={20} /></div>
          <span className={styles.metricLabel}>Despesas do mês</span>
          <strong className={styles.negative}>
            {financialLoading || transactionsError
              ? "—"
              : formatCurrency(financial.expense, "BRL")}
          </strong>
          <small>Saídas registradas</small>
        </article>

        <article className={styles.dashboardMetric}>
          <div className={`${styles.metricIcon} ${styles.metricResult}`} aria-hidden="true"><Coins size={20} /></div>
          <span className={styles.metricLabel}>Resultado do mês</span>
          <strong>
            {financialLoading || transactionsError
              ? "—"
              : formatCurrency(
                  financial.income - financial.expense,
                  "BRL",
                )}
          </strong>
          <small>Receitas menos despesas</small>
        </article>
      </section>
  );
}
