"use client";

import Link from "next/link";

import {
  ArrowLeft,
  CircleDollarSign,
  Coins,
  Landmark,
  WalletCards,
} from "@/components/icons";

import { useAccount } from "@/modules/accounts/hooks";
import { AccountStatus, AccountType } from "@/modules/accounts/types";

import styles from "./AccountDetails.module.scss";

interface AccountDetailsProps {
  accountId: string;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Dinheiro",
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  DIGITAL: "Conta digital",
  INVESTMENT: "Investimento",
  OTHER: "Outro",
};

const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: "Ativa",
  ARCHIVED: "Arquivada",
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

export function AccountDetails({ accountId }: AccountDetailsProps) {
  const { account, loading, error } = useAccount(accountId);

  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.loading}>Carregando conta...</div>
      </section>
    );
  }

  if (error || !account) {
    return (
      <section className={styles.container}>
        <div className={styles.error}>Não foi possível carregar a conta.</div>
      </section>
    );
  }

 return (
  <section className={styles.container}>
    <header className={styles.header}>
      <Link
        href="/dashboard/accounts"
        className={styles.titleLink}
        aria-label="Voltar para contas"
      >
        <div className={styles.titleGroup}>
          <div className={styles.icon}>
            <WalletCards size={22} strokeWidth={1.8} />
          </div>

          <div>
            <h1 className={styles.title}>
              {account.name}
            </h1>

            <p className={styles.description}>
              Detalhes da conta financeira.
            </p>
          </div>
        </div>
      </Link>

      <span
        className={
          account.status === AccountStatus.ACTIVE
            ? styles.active
            : styles.archived
        }
      >
        {ACCOUNT_STATUS_LABELS[account.status]}
      </span>
    </header>

    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <CircleDollarSign size={20} strokeWidth={1.8} />
          <span>Saldo atual</span>
        </div>

        <strong className={styles.balance}>
          {formatCurrency(account.balance, account.currency)}
        </strong>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <WalletCards size={20} strokeWidth={1.8} />
          <span>Saldo inicial</span>
        </div>

        <strong className={styles.value}>
          {formatCurrency(account.initialBalance, account.currency)}
        </strong>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Landmark size={20} strokeWidth={1.8} />
          <span>Tipo</span>
        </div>

        <strong className={styles.value}>
          {ACCOUNT_TYPE_LABELS[account.type]}
        </strong>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Coins size={20} strokeWidth={1.8} />
          <span>Moeda</span>
        </div>

        <strong className={styles.value}>
          {account.currency}
        </strong>
      </div>
    </div>

    <div className={styles.footerActions}>
      <Link
        href="/dashboard/accounts"
        className={styles.backButton}
      >
        <ArrowLeft size={18} strokeWidth={1.8} />
        <span>Voltar para contas</span>
      </Link>
    </div>
  </section>
);
}
