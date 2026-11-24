import type { FinancialObligationInstallmentPaymentStatus as PaymentStatus } from "@/modules/accounts-payable-receivable/types";
import styles from "./InstallmentPaymentStatus.module.scss";

interface InstallmentPaymentStatusProps {
  status: PaymentStatus | null;
}

function formatCurrency(value: string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const INDICATORS = [
  {
    key: "early",
    label: "Adiantado",
    description: "Quitadas antes do vencimento",
    countKey: "earlyCount",
    amountKey: "earlyAmount",
  },
  {
    key: "overdue",
    label: "Atrasado",
    description: "Vencidas ou quitadas em atraso",
    countKey: "overdueCount",
    amountKey: "overdueAmount",
  },
  {
    key: "current",
    label: "Vigente",
    description: "Dentro do prazo",
    countKey: "currentCount",
    amountKey: "currentAmount",
  },
] as const;

export function InstallmentPaymentStatus({
  status,
}: InstallmentPaymentStatusProps) {
  const hasInstallments = status
    ? status.earlyCount + status.overdueCount + status.currentCount > 0
    : false;

  return (
    <section className={styles.panel} aria-label="Situação dos pagamentos de parcelas">
      <header className={styles.heading}>
        <div>
          <h2>Situação dos parcelamentos</h2>
          <p>Acompanhamento dos pagamentos de parcelas</p>
        </div>
      </header>

      {!hasInstallments || !status ? (
        <div className={styles.empty}>
          {hasInstallments ? "Não foi possível carregar a situação dos parcelamentos." : "Nenhum parcelamento encontrado."}
        </div>
      ) : (
        <div className={styles.metrics}>
          {INDICATORS.map((indicator) => {
            const count = status[indicator.countKey];
            const amount = status[indicator.amountKey];

            return (
              <article
                key={indicator.key}
                className={`${styles.metric} ${styles[indicator.key]}`}
              >
                <span className={styles.label}>{indicator.label}</span>
                <strong className={styles.amount}>
                  {formatCurrency(amount)}
                </strong>
                <span className={styles.count}>
                  {count} {count === 1 ? "parcela" : "parcelas"}
                </span>
                <span className={styles.description}>
                  {indicator.description}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
