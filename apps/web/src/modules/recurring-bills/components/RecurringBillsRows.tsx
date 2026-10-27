"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Button, Field, Input } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { useTenantStore } from "@/modules/tenant/stores";
import { recurringBillsService } from "../services/recurring-bills.service";
import type {
  RecurringBill,
  RecurringBillOccurrence,
} from "../types/recurring-bill";
import styles from "@/modules/transactions/components/client/TransactionsPage.module.scss";

interface Props {
  search: string;
  onPayment: () => void;
}

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDueDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function isOverdue(value: string) {
  const today = new Date();
  const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return value.slice(0, 10) < localDate;
}

interface PaymentSelection {
  bill: RecurringBill;
  occurrence: RecurringBillOccurrence;
}

function localToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizePaymentAmount(value: string): string | null {
  const raw = String(value ?? "")
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s/g, "");

  if (!raw) return null;

  let normalized = raw;

  if (raw.includes(",") && raw.includes(".")) {
    normalized =
      raw.lastIndexOf(",") > raw.lastIndexOf(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "");
  } else if (raw.includes(",")) {
    normalized = raw.replace(",", ".");
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount.toFixed(2);
}

function RecurringPaymentModal({
  selection,
  onClose,
  onPaid,
}: {
  selection: PaymentSelection | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [paidDate, setPaidDate] = useState(localToday);
  const [saving, setSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    if (!selection) return;

    setAmount(
      selection.occurrence.expectedAmount ??
        selection.bill.expectedAmount ??
        "",
    );
    setPaidDate(localToday());
    setPaymentError("");
  }, [selection]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection || saving) return;

    const normalized = normalizePaymentAmount(amount);

    if (!normalized) {
      setPaymentError("Informe um valor válido, maior que zero.");
      return;
    }

    if (!paidDate) {
      setPaymentError("Informe a data do pagamento.");
      return;
    }

    setSaving(true);
    setPaymentError("");

    try {
      const paidAt = new Date(`${paidDate}T12:00:00`).toISOString();

      await recurringBillsService.pay(
        selection.bill.id,
        selection.occurrence.id,
        normalized,
        paidAt,
      );

      onPaid();
      onClose();
    } catch {
      setPaymentError(
        "Não foi possível registrar o pagamento. Confira os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={selection !== null}
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Pagar conta recorrente"
    >
      {selection && (
        <form className={styles.recurringPaymentForm} onSubmit={submit}>
          <div className={styles.recurringPaymentSummary}>
            <strong>{selection.bill.title}</strong>
            <span>Conta: {selection.bill.account.name}</span>
            <span>Categoria: {selection.bill.category.name}</span>
            <span>
              Vencimento: {formatDueDate(selection.occurrence.dueDate)}
            </span>
            <span>Valor previsto</span>
            <strong>
              {money.format(
                Number(
                  selection.occurrence.expectedAmount ??
                    selection.bill.expectedAmount ??
                    0,
                ),
              )}
            </strong>
          </div>

          <Field label="Valor pago (R$)" htmlFor="recurring-paid-amount" required>
            <Input
              id="recurring-paid-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={saving}
              placeholder="0,00"
              required
            />
          </Field>

          <Field label="Data do pagamento" htmlFor="recurring-paid-date" required>
            <Input
              id="recurring-paid-date"
              type="date"
              value={paidDate}
              onChange={(event) => setPaidDate(event.target.value)}
              disabled={saving}
              required
            />
          </Field>

          {paymentError && (
            <p className={styles.recurringPaymentError} role="alert">
              {paymentError}
            </p>
          )}

          <div className={styles.recurringPaymentActions}>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={saving || !paidDate}>
              {saving ? "Registrando..." : "Confirmar pagamento"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function RecurringBillsRows({ search, onPayment }: Props) {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelection | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) {
      setBills([]);
      return;
    }

    try {
      const result = await recurringBillsService.list();

      if (useTenantStore.getState().activeTenantId === tenantId) {
        setBills(result);
        setError("");
      }
    } catch {
      if (useTenantStore.getState().activeTenantId === tenantId) {
        setError("Não foi possível carregar as contas recorrentes.");
      }
    }
  }, [tenantId]);

  useEffect(() => {
    const refresh = () => void load();

    window.addEventListener("ccpf:recurring-bills-changed", refresh);
    return () => {
      window.removeEventListener("ccpf:recurring-bills-changed", refresh);
    };
  }, [load]);

  useEffect(() => {
    setBills([]);
    setExpandedId(null);
    void load();
  }, [load]);

  async function generate(billId: string) {
    setBusyId(billId);
    setError("");

    try {
      await recurringBillsService.generate(billId);
      await load();
    } catch {
      setError("Não foi possível gerar os vencimentos.");
    } finally {
      setBusyId(null);
    }
  }

  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

  const visibleBills = bills.filter((bill) =>
    [
      bill.title,
      bill.description ?? "",
      bill.account.name,
      bill.category.name,
    ].some((value) =>
      value.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
    ),
  );

  return (
    <>
      {error && (
        <tr>
          <td colSpan={7}>
            <p className={styles.recurringError} role="alert">
              {error}
            </p>
          </td>
        </tr>
      )}

      {visibleBills.map((bill) => {
        const expanded = expandedId === bill.id;
        const nextPending = bill.occurrences.find(
          (occurrence) => occurrence.status === "PENDING",
        );

        return (
          <Fragment key={bill.id}>
            <tr className={styles.recurringRow}>
              <td>
                <button
                  type="button"
                  className={styles.expandButton}
                  aria-expanded={expanded}
                  aria-label={
                    expanded
                      ? `Recolher ${bill.title}`
                      : `Expandir ${bill.title}`
                  }
                  onClick={() =>
                    setExpandedId(expanded ? null : bill.id)
                  }
                >
                  <span aria-hidden="true">
                    {expanded ? "▼" : "▶"}
                  </span>
                  <strong>{bill.title}</strong>
                </button>
                {bill.description && <small>{bill.description}</small>}
              </td>

              <td>
                {nextPending
                  ? formatDueDate(nextPending.dueDate)
                  : `Dia ${bill.dueDay}`}
              </td>

              <td>{bill.account.name}</td>
              <td>{bill.category.name}</td>

              <td>
                <span className={styles.recurringBadge}>
                  Recorrente
                </span>
              </td>

              <td className={styles.amount}>
                {money.format(Number(bill.expectedAmount ?? 0))}
              </td>

              <td>
                <button
                  type="button"
                  className={styles.expandAction}
                  aria-expanded={expanded}
                  onClick={() =>
                    setExpandedId(expanded ? null : bill.id)
                  }
                >
                  {expanded ? "Recolher" : "Gerenciar"}
                </button>
              </td>
            </tr>

            {expanded && (
              <tr className={styles.recurringDetailsRow}>
                <td colSpan={7}>
                  <div className={styles.recurringDetails}>
                    <div className={styles.recurringDetailsHeader}>
                      <strong>Vencimentos — {bill.title}</strong>

                      <button
                        type="button"
                        className={styles.expandAction}
                        disabled={busyId !== null}
                        onClick={() => void generate(bill.id)}
                      >
                        {busyId === bill.id
                          ? "Gerando..."
                          : "Gerar vencimentos"}
                      </button>
                    </div>

                    {bill.occurrences.length === 0 ? (
                      <p>
                        Nenhum vencimento gerado para esta conta.
                      </p>
                    ) : (
                      <div className={styles.recurringTableScroll}>
                        <table className={styles.recurringInnerTable}>
                          <thead>
                            <tr>
                              <th>Vencimento</th>
                              <th>Valor previsto</th>
                              <th>Valor pago</th>
                              <th>Situação</th>
                              <th>Pago</th>
                            </tr>
                          </thead>

                          <tbody>
                            {bill.occurrences.map((occurrence) => {
                              const paid = occurrence.status === "PAID";
                              const overdue =
                                !paid &&
                                occurrence.status === "PENDING" &&
                                isOverdue(occurrence.dueDate);

                              return (
                                <tr key={occurrence.id}>
                                  <td>
                                    {formatDueDate(occurrence.dueDate)}
                                  </td>
                                  <td>
                                    {money.format(
                                      Number(
                                        occurrence.expectedAmount ??
                                          bill.expectedAmount ??
                                          0,
                                      ),
                                    )}
                                  </td>
                                  <td>
                                    {occurrence.paidAmount
                                      ? money.format(
                                          Number(occurrence.paidAmount),
                                        )
                                      : "—"}
                                  </td>
                                  <td>
                                    {paid
                                      ? "Paga"
                                      : overdue
                                        ? "Vencida"
                                        : occurrence.status === "PENDING"
                                          ? "Pendente"
                                          : occurrence.status}
                                  </td>
                                  <td>
                                    {paid ? (
                                      <span>Pago</span>
                                    ) : occurrence.status === "PENDING" ? (
                                      <Button
                                        type="button"
                                        disabled={busyId !== null}
                                        onClick={() =>
                                          setPaymentSelection({
                                            bill,
                                            occurrence,
                                          })
                                        }
                                      >
                                        Pagar
                                      </Button>
                                    ) : (
                                      <span>—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </Fragment>
        );
      })}
      <RecurringPaymentModal
        selection={paymentSelection}
        onClose={() => setPaymentSelection(null)}
        onPaid={() => {
          void load();
          onPayment();
          window.dispatchEvent(new Event("ccpf:financial-data-changed"));
        }}
      />
    </>
  );
}
