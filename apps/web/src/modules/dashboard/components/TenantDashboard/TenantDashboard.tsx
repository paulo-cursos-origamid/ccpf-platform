"use client";

import {
  Archive,
  ArrowUpRight,
  Wallet,
} from "lucide-react";

import { useAccounts } from "@/modules/accounts/hooks/client/useAccounts";
import { AccountStatus } from "@/modules/accounts/types";

import styles from "./TenantDashboard.module.scss";

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

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

export function TenantDashboard() {
  const { accounts, loading, error, loadAccounts } = useAccounts();

  const activeAccounts = accounts.filter(
    (account) => account.status === AccountStatus.ACTIVE,
  );

  const archivedAccounts = accounts.filter(
    (account) => account.status === AccountStatus.ARCHIVED,
  );

  const totalBalance = activeAccounts.reduce(
    (total, account) =>
      account.currency === "BRL"
        ? total + account.balance
        : total,
    0,
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Minhas finanças</span>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.description}>
            Acompanhe suas contas e o saldo financeiro do seu
            ambiente.
          </p>
        </div>
      </header>

      {error ? (
        <section className={styles.error} role="alert">
          <div>
            <strong>
              Não foi possível carregar suas contas.
            </strong>
            <p>
              Verifique sua conexão e tente novamente.
            </p>
          </div>

          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void loadAccounts()}
          >
            Tentar novamente
          </button>
        </section>
      ) : null}

      <section
        className={styles.metrics}
        aria-label="Resumo financeiro"
      >
        <article className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Wallet
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>
              Saldo total
            </span>

            <strong className={styles.metricValue}>
              {loading
                ? "..."
                : formatCurrency(totalBalance, "BRL")}
            </strong>

            <span className={styles.metricDescription}>
              Soma das contas ativas em BRL.
            </span>
          </div>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Wallet
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>
              Contas
            </span>

            <strong className={styles.metricValue}>
              {loading ? "..." : accounts.length}
            </strong>

            <span className={styles.metricDescription}>
              Contas vinculadas ao seu acesso.
            </span>
          </div>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <ArrowUpRight
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>
              Contas ativas
            </span>

            <strong className={styles.metricValue}>
              {loading ? "..." : activeAccounts.length}
            </strong>

            <span className={styles.metricDescription}>
              Contas disponíveis para movimentação.
            </span>
          </div>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <Archive
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <div className={styles.metricContent}>
            <span className={styles.metricLabel}>
              Arquivadas
            </span>

            <strong className={styles.metricValue}>
              {loading ? "..." : archivedAccounts.length}
            </strong>

            <span className={styles.metricDescription}>
              Contas arquivadas no ambiente.
            </span>
          </div>
        </article>
      </section>

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
    </main>
  );
}
