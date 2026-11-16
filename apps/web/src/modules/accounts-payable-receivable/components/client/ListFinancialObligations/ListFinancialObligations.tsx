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
import { useCreditCards } from "@/modules/credit-cards/hooks";
import { creditCardsService } from "@/modules/credit-cards/services";
import type {
  FinancialObligation,
  FinancialObligationStatus,
  FinancialObligationType,
} from "../../../types";
import styles from "./ListFinancialObligations.module.scss";

type TypeFilter = "ALL" | FinancialObligationType;
type StatusFilter = "ALL" | FinancialObligationStatus;

interface CreditCardCommitmentSummary {
  id: string;
  name: string;
  remainingAmount: number;
  remainingInstallments: number;
}

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATUS_LABELS: Record<FinancialObligationStatus, string> = {
  PENDING: "Pendente",
  PARTIALLY_SETTLED: "Parcialmente liquidado",
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

function currentMonthValue() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthDateRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  return {
    startDate: `${month}-01T00:00:00.000Z`,
    endDate: new Date(
      Date.UTC(year, monthNumber, 0, 23, 59, 59, 999),
    ).toISOString(),
  };
}

const MONTH_OPTIONS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : localToday();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function remainingAmountInCents(item: FinancialObligation) {
  const settlements = item.settlements ?? [];
  const reduced = settlements.reduce(
    (sum, settlement) =>
      sum + amountInCents(settlement.principalAmount),
    0,
  );
  return Math.max(0, amountInCents(item.amount) - reduced);
}

function isOverdue(item: FinancialObligation) {
  return (
    (item.status === "PENDING" || item.status === "PARTIALLY_SETTLED") &&
    item.dueDate.slice(0, 10) < localToday()
  );
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

/** Modal de liquidação total ou parcial de um compromisso. */
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
  const [principalAmount, setPrincipalAmount] = useState("");
  const [interestAmount, setInterestAmount] = useState("0,00");
  const [feeAmount, setFeeAmount] = useState("0,00");
  const [discountAmount, setDiscountAmount] = useState("0,00");
  const [description, setDescription] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [matchingTransactions, setMatchingTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const settlements = item?.settlements ?? [];
  const settledPrincipalCents = settlements.reduce(
    (sum, settlement) => sum + amountInCents(settlement.principalAmount),
    0,
  );
  const remainingCents = item
    ? Math.max(0, amountInCents(item.amount) - settledPrincipalCents)
    : 0;

  const principalCents = amountInCents(principalAmount.replace(",", "."));
  const interestCents = amountInCents(interestAmount.replace(",", "."));
  const feeCents = amountInCents(feeAmount.replace(",", "."));
  const discountCents = amountInCents(discountAmount.replace(",", "."));
  const cashMovementCents =
    principalCents - discountCents + interestCents + feeCents;
  const remainingAfterSettlementCents = remainingCents - principalCents;

  const accountName = accounts.find(
    (account) => account.id === item?.accountId,
  )?.name;
  const categoryName = categories.find(
    (category) => category.id === item?.categoryId,
  )?.name;

  useEffect(() => {
    setSettledDate(localToday());
    setPrincipalAmount(
      item
        ? (remainingAmountInCents(item) / 100).toFixed(2).replace(".", ",")
        : "",
    );
    setInterestAmount("0,00");
    setFeeAmount("0,00");
    setDiscountAmount("0,00");
    setDescription("");
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
        if (active) {
          setMatchingTransactions(
            transactions.filter(
              (transaction) =>
                transaction.accountId === item.accountId &&
                transaction.categoryId === item.categoryId &&
                (transaction.subCategoryId ?? null) === item.subCategoryId &&
                transaction.type === type,
            ),
          );
        }
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

  const compatibleTransactions = matchingTransactions.filter(
    (transaction) =>
      cashMovementCents > 0 &&
      amountInCents(transaction.amount) === cashMovementCents,
  );

  function normalizeAmount(value: string) {
    return value.trim().replace(",", ".");
  }

  function isValidAmount(value: string) {
    return /^\d+(?:\.\d{1,2})?$/.test(normalizeAmount(value));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || saving) return;

    const values = [
      principalAmount,
      interestAmount,
      feeAmount,
      discountAmount,
    ];

    if (values.some((value) => !isValidAmount(value))) {
      setError("Informe valores válidos com até duas casas decimais.");
      return;
    }

    if (
      principalCents <= 0 ||
      discountCents > principalCents ||
      principalCents > remainingCents
    ) {
      setError(
        "Informe um principal maior que zero, sem ultrapassar o saldo restante, e um desconto que não exceda o principal.",
      );
      return;
    }

    if (cashMovementCents > 0 && transactionId) {
      const selected = compatibleTransactions.find(
        (transaction) => transaction.id === transactionId,
      );
      if (!selected) {
        setError("A transação selecionada não corresponde ao valor movimentado.");
        return;
      }
    }

    setSaving(true);
    setError("");

    try {
      await financialObligationsService.settle(item.id, {
        settledAt: new Date(`${settledDate}T12:00:00`).toISOString(),
        principalAmount: normalizeAmount(principalAmount),
        interestAmount: normalizeAmount(interestAmount),
        feeAmount: normalizeAmount(feeAmount),
        discountAmount: normalizeAmount(discountAmount),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(cashMovementCents > 0 && transactionId ? { transactionId } : {}),
      });
      await onSettled();
      onClose();
    } catch {
      setError(
        "Não foi possível registrar a liquidação. Confira os valores e a transação selecionada.",
      );
    } finally {
      setSaving(false);
    }
  }

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
            <span>{accountName ?? "Conta"} · {categoryName ?? "Categoria"}</span>
            <span>Vencimento em {formatDate(item.dueDate)}</span>
            <span>Valor original: {money.format(Number(item.amount))}</span>
            <span>Já amortizado: {money.format(settledPrincipalCents / 100)}</span>
            <strong>Saldo restante: {money.format(remainingCents / 100)}</strong>
          </div>

          <div className={styles.formGrid}>
            <Field label="Principal amortizado (R$)" htmlFor="settlement-principal" required>
              <Input
                id="settlement-principal"
                inputMode="decimal"
                value={principalAmount}
                onChange={(event) => {
                  setPrincipalAmount(event.target.value);
                  setTransactionId("");
                }}
                required
                disabled={saving}
                placeholder="0,00"
              />
            </Field>
            <Field label="Juros (R$)" htmlFor="settlement-interest">
              <Input
                id="settlement-interest"
                inputMode="decimal"
                value={interestAmount}
                onChange={(event) => {
                  setInterestAmount(event.target.value);
                  setTransactionId("");
                }}
                disabled={saving}
              />
            </Field>
            <Field label="Taxas e multas (R$)" htmlFor="settlement-fee">
              <Input
                id="settlement-fee"
                inputMode="decimal"
                value={feeAmount}
                onChange={(event) => {
                  setFeeAmount(event.target.value);
                  setTransactionId("");
                }}
                disabled={saving}
              />
            </Field>
            <Field
              label="Desconto (R$)"
              htmlFor="settlement-discount"
              helperText="Reduz o saldo, mas não movimenta dinheiro."
            >
              <Input
                id="settlement-discount"
                inputMode="decimal"
                value={discountAmount}
                onChange={(event) => setDiscountAmount(event.target.value)}
                disabled={saving}
              />
            </Field>
            <Field label="Data da liquidação" htmlFor="obligation-settled-date" required>
              <Input
                id="obligation-settled-date"
                type="date"
                value={settledDate}
                onChange={(event) => setSettledDate(event.target.value)}
                required
                disabled={saving}
              />
            </Field>
            <Field label="Observações" htmlFor="settlement-description">
              <Input
                id="settlement-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={saving}
                placeholder="Opcional"
              />
            </Field>
          </div>

          <div className={styles.settlementSummary}>
            <span>Valor movimentado: <strong>{money.format(cashMovementCents / 100)}</strong></span>
            <span>
              Saldo após esta liquidação:{" "}
              <strong>
                {money.format(Math.max(0, remainingAfterSettlementCents) / 100)}
              </strong>
            </span>
          </div>

          <Field
            label="Transação já registrada"
            htmlFor="obligation-existing-transaction"
            helperText="Uma transação compatível será vinculada sem movimentar o saldo novamente."
          >
            <select
              id="obligation-existing-transaction"
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              disabled={saving || loadingTransactions || cashMovementCents === 0}
            >
              <option value="">
                {cashMovementCents === 0
                  ? "Liquidação sem movimentação financeira"
                  : "Criar uma nova transação"}
              </option>
              {compatibleTransactions.map((transaction) => (
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

          {settlements.length > 0 && (
            <div className={styles.settlementHistory}>
              <strong>Histórico de liquidações</strong>
              {settlements.map((settlement) => (
                <div key={settlement.id} className={styles.settlementHistoryItem}>
                  <span>{formatDate(settlement.settledAt)}</span>
                  <span>Principal: {money.format(Number(settlement.principalAmount))}</span>
                  <span>Juros e taxas: {money.format(
                    Number(settlement.interestAmount) + Number(settlement.feeAmount),
                  )}</span>
                  {Number(settlement.discountAmount) > 0 && (
                    <span>Desconto: {money.format(Number(settlement.discountAmount))}</span>
                  )}
                  <strong>Movimentado: {money.format(Number(settlement.settledAmount))}</strong>
                </div>
              ))}
            </div>
          )}

          {error && <p className={styles.formError} role="alert">{error}</p>}

          <div className={styles.modalActions}>
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Registrar liquidação
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/** Tela principal para acompanhar os compromissos financeiros do tenant. */
export function ListFinancialObligations() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [monthFilter, setMonthFilter] = useState(currentMonthValue);
  const [page, setPage] = useState(1);
  const [selectedYear, selectedMonth] = monthFilter.split("-");
  const { startDate, endDate } = monthDateRange(monthFilter);

  const {
    obligations,
    pagination,
    summary,
    loading,
    error,
    load,
  } = useFinancialObligations({
    type: typeFilter === "ALL" ? undefined : typeFilter,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    startDate,
    endDate,
    page,
    limit: 20,
  });

  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const {
    cards,
    loading: cardsLoading,
    error: cardsError,
  } = useCreditCards();

  const [cardCommitments, setCardCommitments] = useState<CreditCardCommitmentSummary[]>([]);
  const [cardCommitmentsLoading, setCardCommitmentsLoading] = useState(true);
  const [cardCommitmentsError, setCardCommitmentsError] = useState(false);
  const [editor, setEditor] = useState<"NEW" | FinancialObligation | null>(
    null,
  );
  const [settlement, setSettlement] = useState<FinancialObligation | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!loading && page > pagination.totalPages) {
      setPage(Math.max(1, pagination.totalPages));
    }
  }, [loading, page, pagination.totalPages]);


  useEffect(() => {
    if (cardsLoading) return;

    let active = true;

    async function loadCardCommitments() {
      const activeCards = cards.filter((card) => card.status === "ACTIVE");

      if (cardsError) {
        setCardCommitments([]);
        setCardCommitmentsError(true);
        setCardCommitmentsLoading(false);
        return;
      }

      if (activeCards.length === 0) {
        setCardCommitments([]);
        setCardCommitmentsError(false);
        setCardCommitmentsLoading(false);
        return;
      }

      setCardCommitmentsLoading(true);
      setCardCommitmentsError(false);

      try {
        const firstPage = await creditCardsService.listInvoices({
          page: 1,
          limit: 100,
        });

        const remainingPages = await Promise.all(
          Array.from(
            { length: Math.max(firstPage.pagination.totalPages - 1, 0) },
            (_, index) =>
              creditCardsService.listInvoices({
                page: index + 2,
                limit: 100,
              }),
          ),
        );

        const invoices = [
          ...firstPage.data,
          ...remainingPages.flatMap((result) => result.data),
        ];

        const summaries = new Map(
          activeCards.map((card) => [
            card.id,
            {
              id: card.id,
              name: card.name,
              remainingAmount: 0,
              remainingInstallments: 0,
            },
          ]),
        );

        for (const invoice of invoices) {
          const remainingAmount = Number(invoice.indicators.remainingAmount);

          if (remainingAmount <= 0) continue;

          const summary = summaries.get(invoice.creditCard.id);
          if (!summary) continue;

          summary.remainingAmount += remainingAmount;
          summary.remainingInstallments += invoice.indicators.installmentCount;
        }

        if (active) {
          setCardCommitments(Array.from(summaries.values()));
        }
      } catch {
        if (active) {
          setCardCommitments([]);
          setCardCommitmentsError(true);
        }
      } finally {
        if (active) setCardCommitmentsLoading(false);
      }
    }

    void loadCardCommitments();

    return () => {
      active = false;
    };
  }, [cards, cardsLoading, cardsError]);

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
        aria-label="Resumo dos compromissos"
      >
        <article className={styles.summaryItem}>
          <span className={`${styles.summaryIcon} ${styles.payableIcon}`}>
            <WalletCards size={18} />
          </span>
          <div>
            <span>Total de compromissos</span>
            <strong>{summary.totalCount}</strong>
          </div>
        </article>
        <article className={styles.summaryItem}>
          <span className={`${styles.summaryIcon} ${styles.receivableIcon}`}>
            <ArrowDownRight size={18} />
          </span>
          <div>
            <span>Saldo em aberto</span>
            <strong>
              {money.format(Number(summary.totalRemainingAmount))}
            </strong>
          </div>
        </article>
        <article className={styles.summaryItem}>
          <span className={`${styles.summaryIcon} ${styles.overdueIcon}`}>
            <Calendar size={18} />
          </span>
          <div>
            <span>Em atraso</span>
            <strong>{summary.overdueCount}</strong>
          </div>
        </article>

        <article className={`${styles.summaryItem} ${styles.cardSummaryItem}`}>
          <span className={`${styles.summaryIcon} ${styles.payableIcon}`}>
            <WalletCards size={18} />
          </span>
          <div className={styles.cardSummaryContent}>
            <span className={styles.cardSummaryTitle}>Comprometido nos cartões</span>

            {cardCommitmentsLoading ? (
              <span className={styles.cardSummaryFeedback}>Carregando cartões...</span>
            ) : cardCommitmentsError ? (
              <span className={styles.cardSummaryFeedback}>Não foi possível carregar os cartões.</span>
            ) : cardCommitments.length === 0 ? (
              <span className={styles.cardSummaryFeedback}>Nenhum cartão ativo.</span>
            ) : (
              <ul className={styles.cardSummaryList}>
                {cardCommitments.map((card) => (
                  <li key={card.id}>
                    <div>
                      <strong>{card.name}</strong>
                      <span>
                        {card.remainingInstallments} parcela
                        {card.remainingInstallments === 1 ? "" : "s"} restante
                        {card.remainingInstallments === 1 ? "" : "s"}
                      </span>
                    </div>
                    <strong>{money.format(card.remainingAmount)}</strong>
                  </li>
                ))}
              </ul>
            )}
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
              onClick={() => {
                setTypeFilter(filter);
                setPage(1);
              }}
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
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="PENDING">Pendentes</option>
            <option value="PARTIALLY_SETTLED">Parcialmente liquidados</option>
            <option value="SETTLED">Liquidados</option>
            <option value="CANCELED">Cancelados</option>
            <option value="ALL">Todos os estados</option>
          </select>
        </label>

        <label className={styles.monthFilter}>
          <span>Mês de vencimento</span>

          <select
            aria-label="Mês de vencimento"
            value={selectedMonth}
            onChange={(event) => {
              setMonthFilter(`${selectedYear}-${event.target.value}`);
              setPage(1);
            }}
          >
            {MONTH_OPTIONS.map((month, index) => (
              <option
                key={month}
                value={String(index + 1).padStart(2, "0")}
              >
                {month}
              </option>
            ))}
          </select>

          <select
            aria-label="Ano de vencimento"
            value={selectedYear}
            onChange={(event) => {
              setMonthFilter(`${event.target.value}-${selectedMonth}`);
              setPage(1);
            }}
          >
            {Array.from(
              { length: new Date().getFullYear() - 1999 + 6 },
              (_, index) => 2000 + index,
            ).map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <span className={styles.resultCount}>
          {pagination.totalItems} compromisso
          {pagination.totalItems === 1 ? "" : "s"}
        </span>
      </div>

      {obligations.length === 0 ? (
        <div className={styles.empty}>
          <WalletCards size={28} />
          <h2>Nenhum compromisso encontrado para estes filtros</h2>
          <Button onClick={() => setEditor("NEW")}>
            <Plus size={16} /> Novo compromisso
          </Button>
        </div>
      ) : (
        <div className={styles.obligationList}>
          {obligations.map((item) => {
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
                    <strong>
                      {money.format(remainingAmountInCents(item) / 100)}
                    </strong>
                    {item.status === "PARTIALLY_SETTLED" && (
                      <span className={styles.partialAmount}>
                        de {money.format(Number(item.amount))}
                      </span>
                    )}
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

                  {item.settlements && item.settlements.length > 0 && (
                    <span className={styles.linkedTransaction}>
                      <CheckCircle2 size={15} /> {item.settlements.length} liquidação(ões)
                    </span>
                  )}

                  {(item.status === "PENDING" ||
                    item.status === "PARTIALLY_SETTLED") && (
                    <div className={styles.rowActions}>
                      {item.status === "PENDING" && (
                        <>
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
                        </>
                      )}

                      <Button
                        onClick={() => setSettlement(item)}
                        disabled={busyId === item.id}
                      >
                        <CheckCircle2 size={16} />{" "}
                        {item.status === "PARTIALLY_SETTLED"
                          ? "Nova liquidação"
                          : "Liquidar"}
                      </Button>
                    </div>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Paginação dos compromissos">
          <button
            type="button"
            className={styles.paginationButton}
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </button>

          <span className={styles.paginationInfo}>
            Página {pagination.page} de {pagination.totalPages}
          </span>

          <button
            type="button"
            className={styles.paginationButton}
            disabled={page >= pagination.totalPages}
            onClick={() =>
              setPage((current) =>
                Math.min(pagination.totalPages, current + 1),
              )
            }
          >
            Próxima
          </button>
        </nav>
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
