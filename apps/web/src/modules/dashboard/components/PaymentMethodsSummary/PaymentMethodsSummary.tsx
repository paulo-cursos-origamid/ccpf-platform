"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useDashboardPaymentMethods } from "../../hooks/useDashboardPaymentMethods";
import styles from "./PaymentMethodsSummary.module.scss";

const PAYMENT_METHODS: Record<string, { label: string; color: string }> = {
  CASH: { label: "Dinheiro", color: "#16a34a" },
  PIX: { label: "Pix", color: "#0d9488" },
  BANK_SLIP: { label: "Boleto", color: "#64748b" },
  DEBIT_CARD: { label: "Cartão de débito", color: "#d97706" },
  CREDIT_CARD: { label: "Cartão de crédito", color: "#6366f1" },
};

const UNKNOWN_METHOD = {
  label: "Não informado",
  color: "#94a3b8",
};

function formatCurrency(value: number | string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function PaymentMethodsSummary() {
  const { summary, loading, error, reload } = useDashboardPaymentMethods();

  const methods = (summary?.methods ?? []).map((item) => {
    const config = item.paymentMethod
      ? PAYMENT_METHODS[item.paymentMethod] ?? UNKNOWN_METHOD
      : UNKNOWN_METHOD;

    return {
      name: config.label,
      value: Number(item.totalAmount),
      percentage: Number(item.percentage),
      color: config.color,
    };
  });

  return (
    <section className={styles.panel} aria-label="Formas de pagamento">
      <header className={styles.heading}>
        <div>
          <h2>Formas de pagamento</h2>
          <p>Distribuição das despesas deste mês</p>
        </div>

        {summary && (
          <strong className={styles.total}>
            {formatCurrency(summary.totalAmount)}
          </strong>
        )}
      </header>

      {loading ? (
        <div className={styles.message}>Carregando formas de pagamento...</div>
      ) : error ? (
        <div className={styles.message}>
          <p>Não foi possível carregar as formas de pagamento.</p>
          <button type="button" onClick={() => void reload()}>
            Tentar novamente
          </button>
        </div>
      ) : methods.length === 0 ? (
        <div className={styles.message}>
          Nenhuma despesa registrada neste mês.
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methods}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={3}
                >
                  {methods.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className={styles.legend}>
            {methods.map((item) => (
              <li key={item.name}>
                <span
                  className={styles.indicator}
                  style={{ backgroundColor: item.color }}
                />
                <span className={styles.methodName}>{item.name}</span>
                <strong>{item.percentage.toLocaleString("pt-BR")}%</strong>
                <span className={styles.amount}>
                  {formatCurrency(item.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
