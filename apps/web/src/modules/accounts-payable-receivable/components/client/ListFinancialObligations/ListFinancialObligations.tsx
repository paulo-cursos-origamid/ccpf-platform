"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Pencil,
  Plus,
  WalletCards,
  XCircle,
} from "@/components/icons";
import { Button, Field, Input, Textarea } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { useAccounts } from "@/modules/accounts/hooks";
import type { Account } from "@/modules/accounts/types";
import { useCategories } from "@/modules/categories/hooks";
import type { Category } from "@/modules/categories/types";
import { transactionsService } from "@/modules/transactions/services";
import type { Transaction } from "@/modules/transactions/types";
import { financialObligationsService } from "../../../services/financial-obligations.service";
import { useFinancialObligations } from "../../../hooks";
import type {
  FinancialObligation,
  FinancialObligationStatus,
  FinancialObligationType,
} from "../../../types";
import styles from "./ListFinancialObligations.module.scss";

type TypeFilter = "ALL" | FinancialObligationType;
type StatusFilter = "ALL" | FinancialObligationStatus;

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATUS_LABELS: Record<FinancialObligationStatus, string> = {
  PENDING: "Pendente",
  SETTLED: "Liquidado",
  CANCELED: "Cancelado",
};

function localToday() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : localToday();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function isOverdue(item: FinancialObligation) {
  return item.status === "PENDING" && item.dueDate.slice(0, 10) < localToday();
}

function amountInCents(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : -1;
}

/** Modal de cadastro e edição de compromissos pendentes. */
function ObligationEditor({
  item,
  accounts,
  categories,
  onClose,
  onSaved,
}: {
  item: FinancialObligation | null;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) {
  const [type, setType] = useState<FinancialObligationType>(
    item?.type ?? "PAYABLE",
  );
  const [title, setTitle] = useState(item?.title ?? "");
  const [counterparty, setCounterparty] = useState(item?.counterparty ?? "");
  const [amount, setAmount] = useState(item?.amount ?? "");
  const [dueDate, setDueDate] = useState(dateInputValue(item?.dueDate));
  const [accountId, setAccountId] = useState(item?.accountId ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? "");
  const [subCategoryId, setSubCategoryId] = useState(item?.subCategoryId ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setType(item?.type ?? "PAYABLE");
    setTitle(item?.title ?? "");
    setCounterparty(item?.counterparty ?? "");
    setAmount(item?.amount ?? "");
    setDueDate(dateInputValue(item?.dueDate));
    setAccountId(item?.accountId ?? "");
    setCategoryId(item?.categoryId ?? "");
    setSubCategoryId(item?.subCategoryId ?? "");
    setDescription(item?.description ?? "");
    setError("");
  }, [item]);

  const activeAccounts = accounts.filter(
    (account) => account.status === "ACTIVE" && !account.archivedAt,
  );
  const expectedCategoryType = type === "PAYABLE" ? "EXPENSE" : "INCOME";
  const availableCategories = categories.filter(
    (category) => category.type === expectedCategoryType,
  );
  const selectedCategory = availableCategories.find(
    (category) => category.id === categoryId,
  );
  const availableSubCategories = selectedCategory?.subCategories ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const normalizedAmount = amount.trim().replace(",", ".");
    if (!/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/.test(normalizedAmount)) {
      setError("Informe um valor positivo com até duas casas decimais.");
      return;
    }
    if (!accountId || !categoryId || !dueDate) {
      setError("Selecione conta, categoria e vencimento.");
      return;
    }

    setSaving(true);
    setError("");
    const sharedPayload = {
      type,
      title: title.trim(),
      amount: normalizedAmount,
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      accountId,
      categoryId,
    };

    try {
      if (item) {
        await financialObligationsService.update(item.id, {
          ...sharedPayload,
          counterparty: counterparty.trim() || null,
          subCategoryId: subCategoryId || null,
          description: description.trim() || null,
        });
      } else {
        await financialObligationsService.create({
          ...sharedPayload,
          ...(counterparty.trim() ? { counterparty: counterparty.trim() } : {}),
          ...(subCategoryId ? { subCategoryId } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
      }
      await onSaved();
      onClose();
    } catch {
      setError(
        "Não foi possível salvar o compromisso. Confira os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={() => {
        if (!saving) onClose();
      }}
      title={item ? "Editar compromisso" : "Novo compromisso"}
      className={styles.modal}
      closeOnOverlayClick={!saving}
    >
      <form className={styles.form} onSubmit={submit}>
        <div
          className={styles.directionSwitch}
          role="group"
          aria-label="Tipo do compromisso"
        >
          <button
            type="button"
            aria-pressed={type === "PAYABLE"}
            className={type === "PAYABLE" ? styles.directionActive : ""}
            onClick={() => {
              setType("PAYABLE");
              setCategoryId("");
              setSubCategoryId("");
            }}
          >
            <ArrowUpRight size={17} /> A pagar
          </button>
          <button
            type="button"
            aria-pressed={type === "RECEIVABLE"}
            className={type === "RECEIVABLE" ? styles.directionActive : ""}
            onClick={() => {
              setType("RECEIVABLE");
              setCategoryId("");
              setSubCategoryId("");
            }}
          >
            <ArrowDownRight size={17} /> A receber
          </button>
        </div>

        <div className={styles.formGrid}>
          <Field label="Descrição" htmlFor="obligation-title" required>
            <Input
              id="obligation-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              required
              disabled={saving}
              placeholder="Ex.: Aluguel do escritório"
            />
          </Field>
          <Field label="Valor (R$)" htmlFor="obligation-amount" required>
            <Input
              id="obligation-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
              disabled={saving}
              placeholder="0,00"
            />
          </Field>
          <Field label="Vencimento" htmlFor="obligation-due-date" required>
            <Input
              id="obligation-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
              disabled={saving}
            />
          </Field>
          <Field label="Conta" htmlFor="obligation-account" required>
            <select
              id="obligation-account"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              required
              disabled={saving}
            >
              <option value="">Selecione uma conta</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Categoria" htmlFor="obligation-category" required>
            <select
              id="obligation-category"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setSubCategoryId("");
              }}
              required
              disabled={saving}
            >
              <option value="">Selecione uma categoria</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          {availableSubCategories.length > 0 && (
            <Field label="Subcategoria" htmlFor="obligation-subcategory">
              <select
                id="obligation-subcategory"
                value={subCategoryId}
                onChange={(event) => setSubCategoryId(event.target.value)}
                disabled={saving}
              >
                <option value="">Sem subcategoria</option>
                {availableSubCategories.map((subCategory) => (
                  <option key={subCategory.id} value={subCategory.id}>
                    {subCategory.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Pessoa ou empresa" htmlFor="obligation-counterparty">
            <Input
              id="obligation-counterparty"
              value={counterparty}
              onChange={(event) => setCounterparty(event.target.value)}
              maxLength={160}
              disabled={saving}
              placeholder="Opcional"
            />
          </Field>
          <Field label="Observações" htmlFor="obligation-description">
            <Textarea
              id="obligation-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={3}
              disabled={saving}
              placeholder="Opcional"
            />
          </Field>
        </div>

        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <div className={styles.modalActions}>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {item ? "Salvar alterações" : "Criar compromisso"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Modal que cria uma transação ou associa uma transação já registrada. */
function SettleObligationModal({
  item,
  accounts,
  categories,
  onClose,
  onSettled,
}: {
  item: FinancialObligation | null;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onSettled: () => Promise<unknown>;
}) {
  const [settledDate, setSettledDate] = useState(localToday());
  const [transactionId, setTransactionId] = useState("");
  const [matchingTransactions, setMatchingTransactions] = useState<
    Transaction[]
  >([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSettledDate(localToday());
    setTransactionId("");
    setError("");
    if (!item) {
      setMatchingTransactions([]);
      return;
    }

    let active = true;
    setLoadingTransactions(true);
    const type = item.type === "PAYABLE" ? "EXPENSE" : "INCOME";
    void transactionsService
      .list(type)
      .then((transactions) => {
        if (!active) return;
        setMatchingTransactions(
          transactions.filter(
            (transaction) =>
              transaction.accountId === item.accountId &&
              transaction.categoryId === item.categoryId &&
              (transaction.subCategoryId ?? null) === item.subCategoryId &&
              transaction.type === type &&
              amountInCents(transaction.amount) === amountInCents(item.amount),
          ),
        );
      })
      .catch(() => {
        if (active) setMatchingTransactions([]);
      })
      .finally(() => {
        if (active) setLoadingTransactions(false);
      });

    return () => {
      active = false;
    };
  }, [item]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || saving) return;
    setSaving(true);
    setError("");
    try {
      await financialObligationsService.settle(item.id, {
        settledAt: new Date(`${settledDate}T12:00:00`).toISOString(),
        ...(transactionId ? { transactionId } : {}),
      });
      await onSettled();
      onClose();
    } catch {
      setError(
        "Não foi possível liquidar o compromisso. Verifique se a transação ainda está disponível.",
      );
    } finally {
      setSaving(false);
    }
  }

  const accountName = accounts.find(
    (account) => account.id === item?.accountId,
  )?.name;
  const categoryName = categories.find(
    (category) => category.id === item?.categoryId,
  )?.name;

  return (
    <Modal
      open={item !== null}
      onClose={() => {
        if (!saving) onClose();
      }}
      title={
        item?.type === "PAYABLE"
          ? "Liquidar conta a pagar"
          : "Liquidar conta a receber"
      }
      className={styles.modal}
      closeOnOverlayClick={!saving}
    >
      {item && (
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.settlementSummary}>
            <strong>{item.title}</strong>
            <span>
              {accountName ?? "Conta"} · {categoryName ?? "Categoria"}
            </span>
            <span>Vencimento em {formatDate(item.dueDate)}</span>
            <b>{money.format(Number(item.amount))}</b>
          </div>
          <Field
            label="Data da liquidação"
            htmlFor="obligation-settled-date"
            required
          >
            <Input
              id="obligation-settled-date"
              type="date"
              value={settledDate}
              onChange={(event) => setSettledDate(event.target.value)}
              required
              disabled={saving}
            />
          </Field>
          <Field
            label="Transação já registrada"
            htmlFor="obligation-existing-transaction"
            helperText="Escolher uma transação compatível apenas vincula o compromisso, sem movimentar saldo novamente."
          >
            <select
              id="obligation-existing-transaction"
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              disabled={saving || loadingTransactions}
            >
              <option value="">Criar uma nova transação ao liquidar</option>
              {matchingTransactions.map((transaction) => (
                <option key={transaction.id} value={transaction.id}>
                  {formatDate(transaction.date)} · {transaction.title} ·{" "}
                  {money.format(Number(transaction.amount))}
                </option>
              ))}
            </select>
          </Field>
          {loadingTransactions && (
            <p className={styles.helper}>Buscando transações compatíveis…</p>
          )}
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              {transactionId
                ? "Vincular e liquidar"
                : "Liquidar e criar transação"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/** Tela principal para acompanhar os compromissos financeiros do tenant. */
export function ListFinancialObligations() {
  const { obligations, loading, error, load } = useFinancialObligations();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [editor, setEditor] = useState<"NEW" | FinancialObligation | null>(
    null,
  );
  const [settlement, setSettlement] = useState<FinancialObligation | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const pending = obligations.filter((item) => item.status === "PENDING");
  const pendingPayable = pending
    .filter((item) => item.type === "PAYABLE")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const pendingReceivable = pending
    .filter((item) => item.type === "RECEIVABLE")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const overdueCount = pending.filter(isOverdue).length;
  const visible = obligations.filter(
    (item) =>
      (typeFilter === "ALL" || item.type === typeFilter) &&
      (statusFilter === "ALL" || item.status === statusFilter),
  );

  async function cancel(item: FinancialObligation) {
    if (!window.confirm(`Cancelar o compromisso "${item.title}"?`)) return;
    setBusyId(item.id);
    setActionError("");
    try {
      await financialObligationsService.cancel(item.id);
      await load();
    } catch {
      setActionError("Não foi possível cancelar o compromisso.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <section className={styles.container} aria-busy="true">
        <p className={styles.feedback}>Carregando compromissos…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.container}>
        <div className={styles.feedback} role="alert">
          <p>Não foi possível carregar os compromissos.</p>
          <Button variant="outline" onClick={() => void load()}>
            Tentar novamente
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Financeiro</p>
          <h1 className={styles.title}>Contas a pagar e receber</h1>
        </div>
        <Button onClick={() => setEditor("NEW")}>
          <Plus size={17} /> Novo compromisso
        </Button>
      </header>

      <div
        className={styles.summary}
        aria-label="Resumo de compromissos pendentes"
      >
        <article className={styles.summaryItem}>
          <span className={`${styles.summaryIcon} ${styles.payableIcon}`}>
            <ArrowUpRight size={18} />
          </span>
          <div>
            <span>A pagar</span>
            <strong>{money.format(pendingPayable)}</strong>
          </div>
        </article>
        <article className={styles.summaryItem}>
          <span className={`${styles.summaryIcon} ${styles.receivableIcon}`}>
            <ArrowDownRight size={18} />
          </span>
          <div>
            <span>A receber</span>
            <strong>{money.format(pendingReceivable)}</strong>
          </div>
        </article>
        <article className={styles.summaryItem}>
          <span className={`${styles.summaryIcon} ${styles.overdueIcon}`}>
            <Calendar size={18} />
          </span>
          <div>
            <span>Em atraso</span>
            <strong>{overdueCount}</strong>
          </div>
        </article>
      </div>

      {actionError && (
        <p className={styles.formError} role="alert">
          {actionError}
        </p>
      )}

      <div className={styles.toolbar}>
        <div
          className={styles.segmented}
          role="group"
          aria-label="Filtrar por tipo"
        >
          {(["ALL", "PAYABLE", "RECEIVABLE"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={typeFilter === filter}
              className={typeFilter === filter ? styles.segmentActive : ""}
              onClick={() => setTypeFilter(filter)}
            >
              {filter === "ALL"
                ? "Todos"
                : filter === "PAYABLE"
                  ? "A pagar"
                  : "A receber"}
            </button>
          ))}
        </div>
        <label className={styles.statusFilter}>
          <span>Estado</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
          >
            <option value="PENDING">Pendentes</option>
            <option value="SETTLED">Liquidados</option>
            <option value="CANCELED">Cancelados</option>
            <option value="ALL">Todos os estados</option>
          </select>
        </label>
        <span className={styles.resultCount}>
          {visible.length} compromisso{visible.length === 1 ? "" : "s"}
        </span>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <WalletCards size={28} />
          <h2>
            {obligations.length === 0
              ? "Nenhum compromisso cadastrado"
              : "Nenhum resultado para estes filtros"}
          </h2>
          {obligations.length === 0 && (
            <Button onClick={() => setEditor("NEW")}>
              <Plus size={16} /> Novo compromisso
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.obligationList}>
          {visible.map((item) => {
            const account = accounts.find(
              (candidate) => candidate.id === item.accountId,
            );
            const category = categories.find(
              (candidate) => candidate.id === item.categoryId,
            );
            const overdue = isOverdue(item);
            return (
              <article className={styles.obligationRow} key={item.id}>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>
                    <span
                      className={`${styles.kindIcon} ${item.type === "PAYABLE" ? styles.payableIcon : styles.receivableIcon}`}
                    >
                      {item.type === "PAYABLE" ? (
                        <ArrowUpRight size={18} />
                      ) : (
                        <ArrowDownRight size={18} />
                      )}
                    </span>
                    <div className={styles.titleStack}>
                      <h2>{item.title}</h2>
                      <span>
                        {item.counterparty ||
                          (item.type === "PAYABLE"
                            ? "Conta a pagar"
                            : "Conta a receber")}
                      </span>
                    </div>
                  </div>
                  <div className={styles.context}>
                    <span>{account?.name ?? "Conta indisponível"}</span>
                    <span>{category?.name ?? "Categoria indisponível"}</span>
                  </div>
                  <div className={styles.amountBlock}>
                    <strong>{money.format(Number(item.amount))}</strong>
                    <span
                      className={`${styles.status} ${styles[item.status.toLowerCase()]}`}
                    >
                      {overdue ? "Em atraso" : STATUS_LABELS[item.status]}
                    </span>
                  </div>
                </div>
                <footer className={styles.rowFooter}>
                  <span className={styles.dueDate}>
                    <Calendar size={15} /> Vence {formatDate(item.dueDate)}
                  </span>
                  {item.transactionId && (
                    <span className={styles.linkedTransaction}>
                      <CheckCircle2 size={15} /> Transação vinculada
                    </span>
                  )}
                  {item.status === "PENDING" && (
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        title="Editar compromisso"
                        aria-label={`Editar ${item.title}`}
                        disabled={busyId === item.id}
                        onClick={() => setEditor(item)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.iconButton} ${styles.cancelAction}`}
                        title="Cancelar compromisso"
                        aria-label={`Cancelar ${item.title}`}
                        disabled={busyId === item.id}
                        onClick={() => void cancel(item)}
                      >
                        <XCircle size={16} />
                      </button>
                      <Button
                        onClick={() => setSettlement(item)}
                        disabled={busyId === item.id}
                      >
                        <CheckCircle2 size={16} /> Liquidar
                      </Button>
                    </div>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {editor !== null && (
        <ObligationEditor
          item={editor === "NEW" ? null : editor}
          accounts={accounts}
          categories={categories}
          onClose={() => setEditor(null)}
          onSaved={load}
        />
      )}
      <SettleObligationModal
        item={settlement}
        accounts={accounts}
        categories={categories}
        onClose={() => setSettlement(null)}
        onSettled={load}
      />
    </section>
  );
}
