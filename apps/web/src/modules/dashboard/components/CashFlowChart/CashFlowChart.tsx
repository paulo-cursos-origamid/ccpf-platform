import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardFinancial } from "../TenantDashboard/dashboard.types";
import styles from "../TenantDashboard/TenantDashboard.module.scss";

/**
 * Formata valores monetários apresentados no gráfico.
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
 * Apresenta a evolução das receitas e despesas.
 *
 * Utiliza os indicadores financeiros consolidados
 * para construir o gráfico de fluxo de caixa.
 */
export function CashFlowChart({
  financialLoading,
  transactionsError,
  financial,
}: {
  financialLoading: boolean;
  transactionsError: boolean;
  financial: DashboardFinancial;
}) {
  return (
    <section className={styles.dashboardPanel}>
      <div className={styles.dashboardPanelHeading}>
        <div>
          <h2>Fluxo de caixa</h2>
          <p>Receitas e despesas dos últimos seis meses</p>
        </div>
      </div>

      {financialLoading ? (
        <p className={styles.dashboardEmpty}>Carregando gráfico...</p>
      ) : transactionsError ? (
        <p className={styles.dashboardEmpty}>Gráfico indisponível.</p>
      ) : (
        <div className={styles.dashboardChart}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={financial.chart}>
              <defs>
                <linearGradient
                  id="ccpfIncomeGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#047857" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#047857" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--border-secondary)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value ?? 0), "BRL")}
                contentStyle={{
                  background: "var(--surface-secondary)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: 10,
                  color: "var(--text-primary)",
                }}
              />
              <Area
                type="monotone"
                dataKey="receitas"
                name="Receitas"
                stroke="#047857"
                strokeWidth={3}
                fill="url(#ccpfIncomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="despesas"
                name="Despesas"
                stroke="#fbb755"
                strokeWidth={3}
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
