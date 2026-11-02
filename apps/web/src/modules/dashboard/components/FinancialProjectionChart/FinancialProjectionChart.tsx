import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useFinancialProjection } from '../../hooks/useFinancialProjection';
import styles from './FinancialProjectionChart.module.scss';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const currencyTooltip = (value: unknown, name: unknown) => [
  formatCurrency(Number(value ?? 0)),
  String(name ?? ''),
];

const currencyAxis = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value));

export function FinancialProjectionChart() {
  const { data, loading, error } = useFinancialProjection();

  return (
    <section className={styles.panel}>
      <header className={styles.heading}>
        <div>
          <h2>Projeção financeira mensal</h2>
          <p>
            Evolução do saldo e previsão de despesas nos próximos 12 meses.
          </p>
        </div>

        {data && (
          <div className={styles.initialBalance}>
            <span>Saldo inicial</span>
            <strong>{formatCurrency(data.initialBalance)}</strong>
          </div>
        )}
      </header>

      {loading ? (
        <p className={styles.message}>Calculando projeção...</p>
      ) : error || !data ? (
        <p className={styles.message}>
          Não foi possível carregar a projeção financeira.
        </p>
      ) : (
        <>
          <div className={styles.section}>
            <h3>Saldo projetado</h3>

            <div className={styles.chart}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.months}
                  margin={{ top: 12, right: 16, left: 12, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="var(--border-secondary)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={currencyAxis} width={65} />
                  <ReferenceLine y={0} stroke="var(--text-muted)" />

                  <Tooltip
                    formatter={currencyTooltip}
                    contentStyle={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="projectedBalance"
                    name="Saldo projetado"
                    stroke="#047857"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Despesas projetadas por mês</h3>

            <div className={styles.chart}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.months}
                  margin={{ top: 12, right: 16, left: 12, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="var(--border-secondary)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={currencyAxis} width={65} />

                  <Tooltip
                    formatter={currencyTooltip}
                    contentStyle={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                    }}
                  />

                  <Bar
                    dataKey="installments"
                    name="Parcelas"
                    stackId="expenses"
                    fill="#fbb755"
                  />

                  <Bar
                    dataKey="recurringExpenses"
                    name="Contas recorrentes"
                    stackId="expenses"
                    fill="#047857"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className={styles.note}>
            A projeção considera o saldo atual das contas em reais, parcelas
            pendentes e despesas recorrentes previstas. Receitas futuras
            programadas ainda não são incluídas. Nenhum saldo ou lançamento
            real é alterado.
          </p>
        </>
      )}
    </section>
  );
}
