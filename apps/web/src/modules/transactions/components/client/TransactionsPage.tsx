"use client";

import { useMemo, useState } from "react";
import { Plus } from "@/components/icons";
import { useAccounts } from "@/modules/accounts/hooks";
import { useCategories } from "@/modules/categories/hooks";
import { useTransactions } from "../../hooks/client/useTransactions";
import type { Transaction, TransactionType } from "../../types/transaction";
import { CreateTransactionModal } from "./CreateTransactionModal";
import styles from "./TransactionsPage.module.scss";

const MONEY = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export function TransactionsPage() {
  const [type, setType] = useState<"ALL" | TransactionType>("ALL");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { transactions, loading, error, loadTransactions } = useTransactions(
    type === "ALL" ? undefined : type,
  );
  const { accounts } = useAccounts();
  const { categories: incomeCategories } = useCategories("INCOME");
  const { categories: expenseCategories } = useCategories("EXPENSE");

  const filtered = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    return transactions.filter((item) => {
      const account = accounts.find((entry) => entry.id === item.accountId);
      const category = [...incomeCategories, ...expenseCategories].find(
        (entry) => entry.id === item.categoryId,
      );
      return [
        item.title,
        item.description ?? "",
        account?.name ?? "",
        category?.name ?? "",
      ].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalized));
    });
  }, [transactions, search, accounts, incomeCategories, expenseCategories]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (sum, item) => {
        const amount = Number(item.amount);
        if (item.type === "INCOME") sum.income += amount;
        else sum.expense += amount;
        return sum;
      },
      { income: 0, expense: 0 },
    );
  }, [filtered]);

  function handleCreated(transaction: Transaction) {
    void loadTransactions().catch(() => undefined);
  }

  return (
    <>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Transações</h1>
            <p className={styles.description}>Acompanhe receitas e despesas do Espaço ativo.</p>
          </div>
          <button className={styles.addButton} onClick={() => setModalOpen(true)} type="button">
            <Plus size={18} />
            <span>Nova transação</span>
          </button>
        </header>

        <div className={styles.summary}>
          <article className={styles.summaryCard}>
            <span>Receitas listadas</span>
            <strong className={styles.income}>{MONEY.format(totals.income)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span>Despesas listadas</span>
            <strong className={styles.expense}>{MONEY.format(totals.expense)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <span>Saldo listado</span>
            <strong>{MONEY.format(totals.income - totals.expense)}</strong>
          </article>
        </div>

        <div className={styles.filters}>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar descrição, conta ou categoria..."
            aria-label="Pesquisar transações"
          />
          <select
            value={type}
            onChange={(event) => setType(event.target.value as "ALL" | TransactionType)}
            aria-label="Filtrar por tipo"
          >
            <option value="ALL">Todas</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
          </select>
        </div>

        {loading ? (
          <p className={styles.message}>Carregando transações...</p>
        ) : error ? (
          <p className={styles.error}>Não foi possível carregar as transações.</p>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <h2>Nenhuma transação encontrada</h2>
            <p>Cadastre uma transação ou ajuste os filtros.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Data</th>
                  <th>Conta</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th className={styles.amount}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const account = accounts.find((entry) => entry.id === item.accountId);
                  const category = [...incomeCategories, ...expenseCategories].find(
                    (entry) => entry.id === item.categoryId,
                  );
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        {item.description && <small>{item.description}</small>}
                      </td>
                      <td>{formatDate(item.date)}</td>
                      <td>{account?.name ?? "—"}</td>
                      <td>{category?.name ?? "—"}</td>
                      <td>
                        <span className={item.type === "INCOME" ? styles.income : styles.expense}>
                          {item.type === "INCOME" ? "Receita" : "Despesa"}
                        </span>
                      </td>
                      <td className={styles.amount}>{MONEY.format(Number(item.amount))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className={styles.count}>{filtered.length} transação(ões)</p>
      </section>

      <CreateTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
