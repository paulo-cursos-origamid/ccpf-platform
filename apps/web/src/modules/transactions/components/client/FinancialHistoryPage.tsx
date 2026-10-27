"use client";

import { useEffect, useMemo, useState } from "react";
import { useTenantStore } from "@/modules/tenant/stores";
import { transactionsService } from "../../services/transactions.service";
import type { FinancialHistoryItem } from "../../types/financial-history";
import styles from "./FinancialHistoryPage.module.scss";

const MONEY = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export function FinancialHistoryPage() {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const [items, setItems] = useState<FinancialHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "COMPLETED" | "REVERSED">("ALL");
  const [operation, setOperation] = useState<"ALL" | "TRANSACTION" | "TRANSFER">("ALL");

  useEffect(() => {
    let active = true;

    setItems([]);
    setError(false);
    setLoading(Boolean(activeTenantId));

    if (!activeTenantId) {
      return () => {
        active = false;
      };
    }

    transactionsService.listFinancialHistory()
      .then((result) => {
        if (
          active &&
          useTenantStore.getState().activeTenantId === activeTenantId
        ) {
          setItems(result);
        }
      })
      .catch(() => {
        if (
          active &&
          useTenantStore.getState().activeTenantId === activeTenantId
        ) {
          setError(true);
        }
      })
      .finally(() => {
        if (
          active &&
          useTenantStore.getState().activeTenantId === activeTenantId
        ) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeTenantId]);

  const summary = useMemo(() => {
    return items.reduce(
      (totals, item) => {
        if (item.status !== "COMPLETED") return totals;

        const amount = Number(item.amount);
        if (item.direction === "INCOME") totals.income += amount;
        if (item.direction === "EXPENSE") totals.expense += amount;
        if (item.direction === "TRANSFER") totals.transfers += amount;

        return totals;
      },
      { income: 0, expense: 0, transfers: 0 },
    );
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return items.filter((item) => {
      if (status !== "ALL" && item.status !== status) return false;
      if (operation !== "ALL" && item.operationType !== operation) return false;

      return [
        item.title,
        item.description ?? "",
        item.accountName ?? "",
        item.categoryName ?? "",
        item.fromAccountName ?? "",
        item.toAccountName ?? "",
      ].some((value) => value.toLocaleLowerCase("pt-BR").includes(term));
    });
  }, [items, search, status, operation]);

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Histórico</h1>
          <p className={styles.description}>
            Consulte as movimentações financeiras do Espaço ativo, incluindo operações estornadas.
          </p>
        </div>
      </header>

      <div className={styles.summary}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Receitas concluídas</span>
          <strong className={styles.income}>{MONEY.format(summary.income)}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Despesas concluídas</span>
          <strong className={styles.expense}>{MONEY.format(summary.expense)}</strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Transferências concluídas</span>
          <strong>{MONEY.format(summary.transfers)}</strong>
        </article>
      </div>

      <div className={styles.filters}>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar descrição, conta ou categoria..."
          aria-label="Pesquisar histórico"
        />
        <select
          value={operation}
          onChange={(event) => setOperation(event.target.value as typeof operation)}
          aria-label="Filtrar por operação"
        >
          <option value="ALL">Todas as operações</option>
          <option value="TRANSACTION">Receitas e despesas</option>
          <option value="TRANSFER">Transferências</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          aria-label="Filtrar por situação"
        >
          <option value="ALL">Todas as situações</option>
          <option value="COMPLETED">Concluídas</option>
          <option value="REVERSED">Estornadas</option>
        </select>
      </div>

      {loading ? (
        <p className={styles.message}>Carregando histórico...</p>
      ) : error ? (
        <p className={styles.error}>Não foi possível carregar o histórico financeiro.</p>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <h2>Nenhuma movimentação encontrada</h2>
          <p>Experimente alterar os filtros ou registrar uma movimentação.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Movimentação</th>
                <th>Conta / categoria</th>
                <th>Situação</th>
                <th className={styles.amount}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={`${item.operationType}-${item.id}`}>
                  <td>{formatDate(item.date)}</td>
                  <td>
                    <div className={styles.operation}>
                      <span
                        className={`${styles.operationIcon} ${
                          item.status === "REVERSED" ? styles.operationIconReversed :
                          item.direction === "INCOME" ? styles.operationIconIncome :
                          item.direction === "EXPENSE" ? styles.operationIconExpense :
                          styles.operationIconTransfer
                        }`}
                        aria-hidden="true"
                      >
                        {item.status === "REVERSED" ? "↶" :
                          item.direction === "INCOME" ? "↙" :
                          item.direction === "EXPENSE" ? "↗" : "↔"}
                      </span>
                      <div className={styles.operationDetails}>
                        <strong>{item.title}</strong>
                        {item.originDescription && (
                          <small>{item.originDescription}</small>
                        )}
                    {item.description && item.description !== item.title && (
                      <small>{item.description}</small>
                    )}
                        {item.operationType === "TRANSFER" && (
                          <small>{item.fromAccountName} → {item.toAccountName}</small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {item.operationType === "TRANSFER"
                      ? "Transferência"
                      : [item.accountName, item.categoryName].filter(Boolean).join(" · ")}
                  </td>
                  <td>
                    <span className={item.status === "REVERSED" ? styles.reversed : styles.completed}>
                      {item.status === "REVERSED" ? "Estornada" : "Concluída"}
                    </span>
                  </td>
                  <td className={`${styles.amount} ${
                    item.direction === "INCOME" ? styles.income :
                    item.direction === "EXPENSE" ? styles.expense : ""
                  }`}>
                    {item.direction === "INCOME" ? "+" : item.direction === "EXPENSE" ? "−" : ""}
                    {MONEY.format(Number(item.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
