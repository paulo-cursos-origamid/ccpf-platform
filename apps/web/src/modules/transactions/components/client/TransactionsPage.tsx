"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, CreditCard, Coins } from "@/components/icons";
import { useAccounts } from "@/modules/accounts/hooks";
import { useCategories } from "@/modules/categories/hooks";
import { useTransactions } from "../../hooks/client/useTransactions";
import type { Transaction, TransactionType, Transfer } from "../../types/transaction";
import { transactionsService } from "../../services/transactions.service";
import { CreateTransactionModal } from "./CreateTransactionModal";
import { CreateTransferModal } from "./CreateTransferModal";
import { InstallmentPlansSection } from "./InstallmentPlansSection";
import { MonthlyPaymentsSection } from "./MonthlyPaymentsSection";
import { RecurringBillsSection } from "@/modules/recurring-bills/components/RecurringBillsSection";
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
  const [initialType, setInitialType] = useState<TransactionType>("EXPENSE");
  const [transferOpen, setTransferOpen] = useState(false);
  const [installmentRequest, setInstallmentRequest] = useState(0);
  const [commitmentTab, setCommitmentTab] = useState<
    "INSTALLMENTS" | "RECURRING"
  >("INSTALLMENTS");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [actionError, setActionError] = useState("");
  const [actionBusyId, setActionBusyId] = useState("");
  const { transactions, loading, error, loadTransactions } = useTransactions(
    type === "ALL" ? undefined : type,
  );
  const { accounts } = useAccounts();
  const { categories: incomeCategories } = useCategories("INCOME");
  const { categories: expenseCategories } = useCategories("EXPENSE");

  async function loadTransfers() {
    try {
      const result = await transactionsService.listTransfers();
      setTransfers(result);
    } catch {
      setActionError("Não foi possível carregar as transferências.");
    }
  }

  useEffect(() => {
    void loadTransfers();
  }, []);

  async function handleReverseTransaction(item: Transaction) {
    if (!window.confirm(`Deseja estornar "${item.title}"? O saldo da conta será atualizado.`)) {
      return;
    }
    setActionError("");
    setActionBusyId(item.id);
    try {
      await transactionsService.reverseTransaction(item.id);
      await loadTransactions();
    } catch {
      setActionError("Não foi possível estornar a transação. Verifique seu acesso e tente novamente.");
    } finally {
      setActionBusyId("");
    }
  }

  async function handleReverseTransfer(item: Transfer) {
    if (!window.confirm(`Deseja estornar a transferência entre ${item.fromAccount.name} e ${item.toAccount.name}?`)) {
      return;
    }
    setActionError("");
    setActionBusyId(item.id);
    try {
      await transactionsService.reverseTransfer(item.id);
      await Promise.all([loadTransfers(), loadTransactions()]);
    } catch {
      setActionError("Não foi possível estornar a transferência. Verifique seu acesso e tente novamente.");
    } finally {
      setActionBusyId("");
    }
  }

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
            <p className={styles.description}>Gerencie movimentações, pagamentos e compromissos do Espaço ativo.</p>
          </div>
        </header>

        <div className={styles.summary}>
          <article className={styles.summaryCard}>
            <div className={styles.summaryCardHeader}>
              <span className={`${styles.summaryIcon} ${styles.incomeIcon}`} aria-hidden="true">
                <CircleDollarSign size={20} />
              </span>
              <span>Total de receitas</span>
            </div>
            <strong className={styles.income}>{MONEY.format(totals.income)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <div className={styles.summaryCardHeader}>
              <span className={`${styles.summaryIcon} ${styles.expenseIcon}`} aria-hidden="true">
                <CreditCard size={20} />
              </span>
              <span>Total de despesas</span>
            </div>
            <strong className={styles.expense}>{MONEY.format(totals.expense)}</strong>
          </article>
          <article className={styles.summaryCard}>
            <div className={styles.summaryCardHeader}>
              <span className={`${styles.summaryIcon} ${styles.resultIcon}`} aria-hidden="true">
                <Coins size={20} />
              </span>
              <span>Resultado das movimentações</span>
            </div>
            <strong>{MONEY.format(totals.income - totals.expense)}</strong>
          </article>
        </div>


        <MonthlyPaymentsSection />

        <section className={styles.choices} id="transaction-choices" aria-labelledby="choices-title">
          <div>
            <h2 className={styles.choicesTitle} id="choices-title">Operações rápidas</h2>
            <p className={styles.description}>Selecione uma operação para registrar ou planejar movimentações.</p>
          </div>
          <div className={styles.choiceGrid}>
            <button
              className={styles.choiceCard}
              type="button"
              onClick={() => {
                setInitialType("INCOME");
                setModalOpen(true);
              }}
            >
              <strong>Receita</strong>
              <span>Registrar dinheiro recebido</span>
            </button>
            <button
              className={styles.choiceCard}
              type="button"
              onClick={() => {
                setInitialType("EXPENSE");
                setModalOpen(true);
              }}
            >
              <strong>Despesa</strong>
              <span>Registrar um gasto</span>
            </button>
            <button
              className={styles.choiceCard}
              type="button"
              onClick={() => setTransferOpen(true)}
            >
              <strong>Transferência</strong>
              <span>Mover valores entre contas</span>
            </button>
            <button
              className={styles.choiceCard}
              type="button"
              onClick={() => {
                setCommitmentTab("INSTALLMENTS");
                setInstallmentRequest((value) => value + 1);
              }}
            >
              <strong>Compra parcelada</strong>
              <span>Planejar parcelas futuras</span>
            </button>
          </div>
        </section>


        <section
          className={styles.contentSection}
          aria-labelledby="transactions-list-title"
        >
          <header className={styles.sectionHeading}>
            <div>
              <h2 id="transactions-list-title">Movimentações</h2>
              <p>Consulte receitas e despesas registradas no Espaço.</p>
            </div>
            <span className={styles.sectionCount}>
              {filtered.length} registro(s)
            </span>
          </header>

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
                  <th>Ações</th>
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
                      <td>
                        <button
                          className={styles.reverseButton}
                          type="button"
                          disabled={actionBusyId === item.id}
                          onClick={() => void handleReverseTransaction(item)}
                        >
                          {actionBusyId === item.id ? "Estornando..." : "Estornar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {actionError && <p className={styles.error} role="alert">{actionError}</p>}

        </section>

        <section
          className={styles.commitments}
          aria-labelledby="commitments-title"
        >
          <header className={styles.sectionHeading}>
            <div>
              <h2 id="commitments-title">
                Pagamentos e compromissos
              </h2>
              <p>
                Gerencie compras parceladas e contas recorrentes
                em um só lugar.
              </p>
            </div>
          </header>

          <div
            className={styles.commitmentTabs}
            role="tablist"
            aria-label="Tipos de compromissos financeiros"
          >
            <button
              type="button"
              role="tab"
              id="installments-tab"
              aria-selected={commitmentTab === "INSTALLMENTS"}
              aria-controls="installments-panel"
              className={
                commitmentTab === "INSTALLMENTS"
                  ? styles.commitmentTabActive
                  : styles.commitmentTab
              }
              onClick={() => setCommitmentTab("INSTALLMENTS")}
            >
              Compras parceladas
            </button>

            <button
              type="button"
              role="tab"
              id="recurring-tab"
              aria-selected={commitmentTab === "RECURRING"}
              aria-controls="recurring-panel"
              className={
                commitmentTab === "RECURRING"
                  ? styles.commitmentTabActive
                  : styles.commitmentTab
              }
              onClick={() => setCommitmentTab("RECURRING")}
            >
              Contas recorrentes
            </button>
          </div>

          <div
            id="installments-panel"
            role="tabpanel"
            aria-labelledby="installments-tab"
            hidden={commitmentTab !== "INSTALLMENTS"}
          >
            <InstallmentPlansSection
              createRequest={installmentRequest}
            />
          </div>

          <div
            id="recurring-panel"
            role="tabpanel"
            aria-labelledby="recurring-tab"
            hidden={commitmentTab !== "RECURRING"}
          >
            <RecurringBillsSection
              search={search}
              onPayment={() => {
                void loadTransactions();
              }}
            />
          </div>
        </section>

        <section className={styles.transferHistory} aria-labelledby="transfer-history-title">
          <div className={styles.transferHeading}>
            <div>
              <h2 id="transfer-history-title">
                Transferências entre contas
              </h2>
              <p>
                Consulte as movimentações realizadas entre suas contas.
              </p>
            </div>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => setTransferOpen(true)}
            >
              + Nova transferência
            </button>
          </div>
          {transfers.length === 0 ? (
            <div className={styles.empty}>
              <h2>Nenhuma transferência registrada</h2>
              <p>As transferências realizadas entre suas contas aparecerão aqui.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Conta de origem</th>
                    <th>Conta de destino</th>
                    <th className={styles.amount}>Valor</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {transfers.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.createdAt)}</td>

                      <td>
                        <strong>
                          {item.description ||
                            "Transferência entre contas"}
                        </strong>
                      </td>

                      <td>{item.fromAccount.name}</td>

                      <td>{item.toAccount.name}</td>

                      <td className={styles.amount}>
                        {MONEY.format(Number(item.amount))}
                      </td>

                      <td>
                        <button
                          className={styles.reverseButton}
                          type="button"
                          disabled={actionBusyId === item.id}
                          onClick={() =>
                            void handleReverseTransfer(item)
                          }
                        >
                          {actionBusyId === item.id
                            ? "Estornando..."
                            : "Estornar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </section>

      <CreateTransactionModal
        open={modalOpen}
        initialType={initialType}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
      <CreateTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onCreated={() => void loadTransactions().catch(() => undefined)}
      />
    </>
  );
}
