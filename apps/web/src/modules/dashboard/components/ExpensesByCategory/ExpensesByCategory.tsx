import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardFinancial } from "../TenantDashboard/dashboard.types";
import styles from "../TenantDashboard/TenantDashboard.module.scss";

/**
 * Formata valores monetários das categorias.
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
 * Apresenta a distribuição das despesas por categoria.
 *
 * Utiliza os valores agrupados e as cores definidas
 * para representar visualmente as despesas do mês.
 */
export function ExpensesByCategory({
  financialLoading,
  transactionsError,
  categoryExpenses,
  categoryColors,
}: {
  financialLoading: boolean;
  transactionsError: boolean;
  categoryExpenses: Array<{ name: string; value: number }>;
  categoryColors: string[];
}) {
  return (
    <section className={styles.dashboardPanel}>
      <div className={styles.dashboardPanelHeading}>
        <div>
          <h2>Despesas por categoria</h2>
          <p>Distribuição das despesas deste mês</p>
        </div>
      </div>

      {financialLoading || transactionsError ? (
        <p className={styles.dashboardEmpty}>
          {transactionsError
            ? "Dados indisponíveis."
            : "Carregando despesas..."}
        </p>
      ) : categoryExpenses.length === 0 ? (
        <p className={styles.dashboardEmpty}>
          Nenhuma despesa registrada neste mês.
        </p>
      ) : (
        <div className={styles.categoryChartLayout}>
          <div className={styles.categoryChart}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryExpenses}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={3}
                >
                  {categoryExpenses.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={categoryColors[index % categoryColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(Number(value ?? 0), "BRL")
                  }
                  contentStyle={{
                    backgroundColor: "var(--surface-primary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "12px",
                    boxShadow: "var(--shadow-sm)",
                    color: "var(--text-primary)",
                    padding: "10px 12px",
                  }}
                  labelStyle={{
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                  itemStyle={{
                    color: "var(--text-primary)",
                    fontWeight: 700,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.categoryLegend}>
            {categoryExpenses.map((item, index) => {
              const total = categoryExpenses.reduce(
                (sum, category) => sum + category.value,
                0,
              );
              const percentage = total > 0
                ? Math.round((item.value / total) * 100)
                : 0;

              return (
                <div className={styles.categoryLegendItem} key={item.name}>
                  <span
                    className={styles.categoryDot}
                    style={{
                      background: categoryColors[index % categoryColors.length],
                    }}
                  />
                  <span className={styles.categoryName}>{item.name}</span>
                  <span className={styles.categoryPercentage}>{percentage}%</span>
                  <strong>{formatCurrency(item.value, "BRL")}</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
