import Link from "next/link";
import { Wallet } from "lucide-react";
import { AccountStatus } from "@/modules/accounts/types";
import type { Account } from "@/modules/accounts/types";
import styles from "../TenantDashboard/TenantDashboard.module.scss";

/**
 * Obtém o rótulo de apresentação de um tipo de conta.
 *
 * @param type - Identificador do tipo de conta.
 * @returns Descrição utilizada na interface.
 */
function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CASH: "Dinheiro",
    CHECKING: "Conta corrente",
    SAVINGS: "Poupança",
    DIGITAL: "Conta digital",
    INVESTMENT: "Investimentos",
    OTHER: "Outra",
  };
  return labels[type] ?? type;
}

/**
 * Formata o saldo monetário de uma conta.
 *
 * @param value - Valor numérico.
 * @param currency - Código da moeda.
 * @returns Saldo formatado.
 */
function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Apresenta as contas financeiras do Espaço ativo.
 *
 * Exibe informações das contas cadastradas e seus saldos,
 * respeitando o estado de carregamento.
 */
export function AccountsOverview({ accounts, loading }: {
  accounts: Account[];
  loading: boolean;
}) {
  return (
<section className={styles.accountsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>
              Patrimônio
            </span>
            <h2 className={styles.sectionTitle}>
              Minhas contas
            </h2>
          </div>

          <span className={styles.accountCount}>
            {loading ? "..." : `${accounts.length} contas`}
          </span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <p>Carregando suas contas...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className={styles.emptyState}>
            <Wallet
              size={24}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <strong>Nenhuma conta encontrada</strong>
            <p>
              Suas contas financeiras aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className={styles.accountsList}>
            {accounts.map((account) => (
              <article
                key={account.id}
                className={styles.accountCard}
              >
                <div className={styles.accountIdentity}>
                  <div className={styles.accountIcon}>
                    <Wallet
                      size={19}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <h3 className={styles.accountName}>
                      {account.name}
                    </h3>

                    <p className={styles.accountType}>
                      {getAccountTypeLabel(account.type)}
                    </p>
                  </div>
                </div>

                <div className={styles.accountBalance}>
                  <span>Saldo</span>
                  <strong>
                    {formatCurrency(
                      account.balance,
                      account.currency,
                    )}
                  </strong>
                </div>

                <span
                  className={`${styles.accountStatus} ${
                    account.status === AccountStatus.ACTIVE
                      ? styles.accountStatusActive
                      : styles.accountStatusArchived
                  }`}
                >
                  {account.status === AccountStatus.ACTIVE
                    ? "Ativa"
                    : "Arquivada"}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
  );
}
