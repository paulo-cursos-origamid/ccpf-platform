import {
  Wallet,
  CircleDollarSign,
  CreditCard,
  Coins,
} from "@/components/icons";
import type { DashboardFinancial } from "../TenantDashboard/dashboard.types";
import { DashboardMetricCard } from "../DashboardMetricCard/DashboardMetricCard";
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
export function FinancialSummary({
  loading,
  totalBalance,
  financialLoading,
  transactionsError,
  financial,
}: {
  loading: boolean;
  totalBalance: number;
  financialLoading: boolean;
  transactionsError: boolean;
  financial: DashboardFinancial;
}) {
  return (
    <section
      className={styles.dashboardMetrics}
      aria-label="Indicadores financeiros"
    >
      <DashboardMetricCard
        icon={<Wallet size={20} />}
        iconClassName={styles.metricBalance}
        label="Saldo total"
        value={loading ? "..." : formatCurrency(totalBalance, "BRL")}
        description="Contas ativas em reais"
        trendUnavailableText="Sem histórico mensal de saldo"
      />
      <DashboardMetricCard
        icon={<CircleDollarSign size={20} />}
        iconClassName={styles.metricIncome}
        label="Receitas do mês"
        value={
          financialLoading || transactionsError
            ? "—"
            : formatCurrency(financial.income, "BRL")
        }
        description="Entradas registradas"
        trend={
          financialLoading || transactionsError
            ? undefined
            : {
                current: financial.income,
                previous: financial.previousIncome,
                increaseIsPositive: true,
              }
        }
        valueTone="positive"
      />
      <DashboardMetricCard
        icon={<CreditCard size={20} />}
        iconClassName={styles.metricExpense}
        label="Despesas do mês"
        value={
          financialLoading || transactionsError
            ? "—"
            : formatCurrency(financial.expense, "BRL")
        }
        description="Saídas registradas"
        trend={
          financialLoading || transactionsError
            ? undefined
            : {
                current: financial.expense,
                previous: financial.previousExpense,
                increaseIsPositive: false,
              }
        }
        valueTone="negative"
      />
      <DashboardMetricCard
        icon={<Coins size={20} />}
        iconClassName={styles.metricResult}
        label="Resultado do mês"
        value={
          financialLoading || transactionsError
            ? "—"
            : formatCurrency(financial.income - financial.expense, "BRL")
        }
        description="Receitas menos despesas"
        trend={
          financialLoading || transactionsError
            ? undefined
            : {
                current: financial.income - financial.expense,
                previous: financial.previousIncome - financial.previousExpense,
                increaseIsPositive: true,
              }
        }
      />
    </section>
  );
}
