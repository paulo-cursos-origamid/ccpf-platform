"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTenantStore } from "@/modules/tenant/stores";
import { installmentPlansService } from "../../services/installment-plans.service";
import { recurringBillsService } from "@/modules/recurring-bills/services/recurring-bills.service";
import type { InstallmentPlan } from "../../types/installment-plan";
import type { RecurringBill } from "@/modules/recurring-bills/types/recurring-bill";
import styles from "./MonthlyPaymentsSection.module.scss";

type PaymentStatus = "PAID" | "PENDING" | "OVERDUE" | "CANCELED";

interface MonthlyPayment {
  id: string;
  title: string;
  origin: "INSTALLMENT" | "RECURRING";
  detail: string;
  account: string;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number | null;
  status: PaymentStatus;
}

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

function currentMonth() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function today() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function changeMonth(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(year, number - 1 + offset, 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function resolveStatus(status: string, dueDate: string): PaymentStatus {
  if (status === "PAID") return "PAID";
  if (status === "CANCELED") return "CANCELED";
  if (dueDate.slice(0, 10) < today()) return "OVERDUE";
  return "PENDING";
}

const statusLabels: Record<PaymentStatus, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
  CANCELED: "Cancelado",
};

export function MonthlyPaymentsSection() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const [month, setMonth] = useState(currentMonth);
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const load = useCallback(async () => {
    if (!tenantId) {
      setPlans([]);
      setBills([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [plansResult, billsResult] = await Promise.allSettled([
      installmentPlansService.list(),
      recurringBillsService.list(),
    ]);

    if (useTenantStore.getState().activeTenantId !== tenantId) {
      return;
    }

    if (
      plansResult.status === "fulfilled" &&
      billsResult.status === "fulfilled"
    ) {
      setPlans(plansResult.value);
      setBills(billsResult.value);
    } else {
      setPlans([]);
      setBills([]);
      setError("Não foi possível carregar a agenda de pagamentos.");
    }

    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load, revision]);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);

    window.addEventListener("ccpf:financial-data-changed", refresh);
    window.addEventListener("ccpf:recurring-bills-changed", refresh);

    return () => {
      window.removeEventListener("ccpf:financial-data-changed", refresh);
      window.removeEventListener("ccpf:recurring-bills-changed", refresh);
    };
  }, []);

  const payments = useMemo(() => {
    const result: MonthlyPayment[] = [];

    for (const plan of plans) {
      for (const installment of plan.installments) {
        const dueDate = installment.dueDate.slice(0, 10);

        if (!dueDate.startsWith(month)) continue;

        const status = resolveStatus(installment.status, dueDate);
        const amount = Number(installment.amount);

        result.push({
          id: `installment-${installment.id}`,
          title: plan.title,
          origin: "INSTALLMENT",
          detail: `Parcela ${installment.installmentNumber}/${plan.installmentCount}`,
          account: "",
          dueDate,
          expectedAmount: amount,
          paidAmount: status === "PAID" ? amount : null,
          status,
        });
      }
    }

    for (const bill of bills) {
      for (const occurrence of bill.occurrences) {
        const dueDate = occurrence.dueDate.slice(0, 10);

        if (!dueDate.startsWith(month)) continue;

        const status = resolveStatus(occurrence.status, dueDate);

        result.push({
          id: `recurring-${occurrence.id}`,
          title: bill.title,
          origin: "RECURRING",
          detail: "Conta recorrente",
          account: bill.account.name,
          dueDate,
          expectedAmount: Number(
            occurrence.expectedAmount ?? bill.expectedAmount ?? 0,
          ),
          paidAmount:
            occurrence.paidAmount === null
              ? null
              : Number(occurrence.paidAmount),
          status,
        });
      }
    }

    return result.sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) ||
        a.title.localeCompare(b.title, "pt-BR"),
    );
  }, [plans, bills, month]);

  const summary = useMemo(() => {
    return payments.reduce(
      (total, payment) => {
        if (payment.status === "CANCELED") return total;

        total.expected += payment.expectedAmount;

        if (payment.status === "PAID") {
          total.paid += payment.paidAmount ?? payment.expectedAmount;
        } else if (payment.status === "OVERDUE") {
          total.overdue += payment.expectedAmount;
        } else {
          total.pending += payment.expectedAmount;
        }

        return total;
      },
      { expected: 0, paid: 0, pending: 0, overdue: 0 },
    );
  }, [payments]);

  const [year, monthNumber] = month.split("-").map(Number);
  const monthLabel = monthFormatter.format(
    new Date(year, monthNumber - 1, 1),
  );

  return (
    <section
      className={styles.section}
      aria-labelledby="monthly-payments-title"
    >
      <header className={styles.header}>
        <div>
          <h2 id="monthly-payments-title">Agenda de pagamentos</h2>
          <p>
            Parcelas e contas recorrentes com vencimento no mês selecionado.
          </p>
        </div>

        <div className={styles.navigation}>
          <button
            type="button"
            onClick={() => setMonth(changeMonth(month, -1))}
            aria-label="Mês anterior"
          >
            ‹
          </button>

          <strong>{monthLabel}</strong>

          <button
            type="button"
            onClick={() => setMonth(changeMonth(month, 1))}
            aria-label="Próximo mês"
          >
            ›
          </button>

          <button
            type="button"
            className={styles.todayButton}
            onClick={() => setMonth(currentMonth())}
          >
            Mês atual
          </button>
        </div>
      </header>

      <div className={styles.summary}>
        <article>
          <span>Total previsto</span>
          <strong>{money.format(summary.expected)}</strong>
        </article>

        <article>
          <span>Total pago</span>
          <strong className={styles.paid}>
            {money.format(summary.paid)}
          </strong>
        </article>

        <article>
          <span>Pendente</span>
          <strong className={styles.pending}>
            {money.format(summary.pending)}
          </strong>
        </article>

        <article>
          <span>Vencido</span>
          <strong className={styles.overdue}>
            {money.format(summary.overdue)}
          </strong>
        </article>
      </div>

      {loading ? (
        <p className={styles.message}>Carregando pagamentos...</p>
      ) : error ? (
        <div className={styles.message} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void load()}>
            Tentar novamente
          </button>
        </div>
      ) : payments.length === 0 ? (
        <p className={styles.message}>
          Nenhum pagamento encontrado para este mês.
        </p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Descrição</th>
                <th>Origem</th>
                <th>Conta</th>
                <th>Valor previsto</th>
                <th>Valor pago</th>
                <th>Situação</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.dueDate)}</td>

                  <td>
                    <strong>{payment.title}</strong>
                    <small>{payment.detail}</small>
                  </td>

                  <td>
                    {payment.origin === "INSTALLMENT"
                      ? "Compra parcelada"
                      : "Recorrente"}
                  </td>

                  <td>{payment.account || "—"}</td>

                  <td>{money.format(payment.expectedAmount)}</td>

                  <td>
                    {payment.paidAmount === null
                      ? "—"
                      : money.format(payment.paidAmount)}
                  </td>

                  <td>
                    <span
                      className={`${styles.badge} ${
                        styles[payment.status.toLowerCase()]
                      }`}
                    >
                      {statusLabels[payment.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className={styles.footer}>
        <span>{payments.length} pagamento(s) no mês</span>
        <span>
          Para registrar pagamentos, utilize as seções de compras
          parceladas e contas recorrentes abaixo.
        </span>
      </footer>
    </section>
  );
}
