"use client";

import Link from "next/link";
import { useState } from "react";

import { Plus, Users } from "@/components/icons";

import { CreateAccountModal } from "@/modules/accounts/components/client/CreateAccountModal";
import { useAccounts } from "@/modules/accounts/hooks";
import {
  AccountStatus,
  AccountType,
  type Account,
} from "@/modules/accounts/types";

import styles from "./ListAccounts.module.scss";

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

function formatBalance(account: Account) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: account.currency,
  }).format(account.balance);
}

export function ListAccounts() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { accounts, loading, error, loadAccounts } = useAccounts();

  function handleCreated() {
    void loadAccounts();
  }

  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.loading}>Carregando contas...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.container}>
        <div className={styles.error}>Não foi possível carregar as contas.</div>
      </section>
    );
  }

  return (
    <>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Contas</h1>

            <p className={styles.description}>
              Gerencie suas contas financeiras.
            </p>
          </div>

          <div className={styles.headerActions}>
            <span className={styles.total}>
              {accounts.length} conta{accounts.length !== 1 ? "s" : ""}
            </span>

            <button
              type="button"
              className={styles.addButton}
              aria-label="Nova conta"
              title="Nova conta"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus size={18} strokeWidth={1.8} />

              <span>Nova conta</span>
            </button>
          </div>
        </header>

        {accounts.length === 0 ? (
          <div className={styles.empty}>
            <h2>Nenhuma conta encontrada</h2>

            <p>Você ainda não possui contas cadastradas.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Moeda</th>
                  <th>Saldo</th>
                  <th>Status</th>
                  <th className={styles.actionsHeader}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className={styles.row}>
                    <td>
                      <Link
                        href={`/dashboard/accounts/${account.id}`}
                        className={styles.rowLink}
                        aria-label={`Ver detalhes da conta ${account.name}`}
                      />

                      <strong className={styles.accountName}>
                        {account.name}
                      </strong>
                    </td>

                    <td>{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</td>

                    <td>{account.currency}</td>

                    <td className={styles.balance}>{formatBalance(account)}</td>

                    <td>
                      <span
                        className={
                          account.status === AccountStatus.ACTIVE
                            ? styles.active
                            : styles.archived
                        }
                      >
                        {ACCOUNT_STATUS_LABELS[account.status] ??
                          account.status}
                      </span>
                    </td>

                    <td>
                      {(account.role === "OWNER" ||
                        account.role === "MANAGER") && (
                        <div className={styles.actions}>
                          <Link
                            href={`/dashboard/accounts/${account.id}`}
                            className={styles.actionButton}
                            aria-label={`Gerenciar membros da conta ${account.name}`}
                            title="Gerenciar membros"
                          >
                            <Users size={17} strokeWidth={1.8} />
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CreateAccountModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
