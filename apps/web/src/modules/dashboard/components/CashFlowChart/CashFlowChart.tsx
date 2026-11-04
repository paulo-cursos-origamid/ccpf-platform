import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
            <ComposedChart
              data={financial.chart.map((item) => ({
                ...item,
                saldo: item.receitas - item.despesas,
              }))}
            >
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
              <Legend />
              <Bar
                dataKey="receitas"
                name="Receitas"
                fill="#10b981"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="despesas"
                name="Despesas"
                fill="#ef4444"
                radius={[3, 3, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                name="Saldo"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
