"use client";

import { Select } from "@/components/ui/forms";

import { useState } from "react";
import { useCreditCards, useCreditCardInvoices } from "@/modules/credit-cards/hooks";
import type {
  CreditCardInvoice,
  CreditCardInvoiceStatus,
} from "@/modules/credit-cards/types";
import { CreditCardInvoiceDetailsModal } from "../CreditCardInvoiceDetailsModal";

import styles from "./ListCreditCardInvoices.module.scss";

const PAGE_SIZE = 10;

function getCurrentMonth() {
  const now = new Date();
  return String(now.getFullYear()) + "-" + String(now.getMonth() + 1).padStart(2, "0");
}

function shiftMonth(value: string, offset: number) {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return String(date.getFullYear()) + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function getMonthRange(value: string) {
  const [year, month] = value.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    from: value + "-01",
    to: value + "-" + String(lastDay).padStart(2, "0"),
  };
}

const STATUS_LABELS: Record<CreditCardInvoiceStatus, string> = {
  OPEN: "Aberta",
  CLOSED: "Fechada",
  PAID: "Paga",
};

function formatCurrency(value: string | number) {
  const amount = Number(value);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string) {
  const datePart = value.slice(0, 10);
  const date = new Date(`${datePart}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatReferenceMonth(value: string) {
  const month = value.slice(0, 7);
  const date = new Date(`${month}-01T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function ListCreditCardInvoices() {
  const {
    cards,
    loading: cardsLoading,
  } = useCreditCards();

  const [filters, setFilters] = useState<{
    creditCardId: string;
    status: CreditCardInvoiceStatus | "";
  }>({
    creditCardId: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const currentMonth = getCurrentMonth();
  const [referenceMonth, setReferenceMonth] = useState(currentMonth);
  const monthRange = getMonthRange(referenceMonth);

  const {
    invoices,
    pagination,
    loading,
    error,
    load,
  } = useCreditCardInvoices({
    creditCardId: filters.creditCardId || undefined,
    status: filters.status || undefined,
    referenceMonthFrom: monthRange.from + "T00:00:00.000Z",
    referenceMonthTo: monthRange.to + "T23:59:59.999Z",
    page,
    limit: PAGE_SIZE,
  });

  const [selectedInvoice, setSelectedInvoice] =
    useState<CreditCardInvoice | null>(null);

  const totalRemaining = invoices.reduce(
    (total, invoice) =>
      total + (Number(invoice.indicators.remainingAmount) || 0),
    0,
  );

  const totalPages = Math.max(1, pagination.totalPages);

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Faturas</h2>
          <p className={styles.description}>
            Acompanhe os valores, vencimentos e situação das faturas dos seus cartões.
          </p>
        </div>

        <span className={styles.total}>
          {pagination.total} fatura{pagination.total !== 1 ? "s" : ""}
        </span>
      </header>

      <div className={styles.monthNavigation} aria-label="Navegação por competência">
        <button
          type="button"
          className={styles.monthButton}
          aria-label="Mês anterior"
          onClick={() => {
            setReferenceMonth((current) => shiftMonth(current, -1));
            setPage(1);
          }}
        >
          ←
        </button>

        <strong>{formatReferenceMonth(referenceMonth + "-01")}</strong>

        <button
          type="button"
          className={styles.monthButton}
          aria-label="Próximo mês"
          onClick={() => {
            setReferenceMonth((current) => shiftMonth(current, 1));
            setPage(1);
          }}
        >
          →
        </button>

        {referenceMonth !== currentMonth && (
          <button
            type="button"
            className={styles.currentMonthButton}
            onClick={() => {
              setReferenceMonth(currentMonth);
              setPage(1);
            }}
          >
            Mês atual
          </button>
        )}
      </div>

      <div className={styles.filters}>
        <label className={styles.filterField}>
          <span>Cartão</span>
          <Select
            value={filters.creditCardId}
            onChange={(event) => {
              setFilters((current) => ({
                ...current,
                creditCardId: event.target.value,
              }));
              setPage(1);
            }}
            disabled={cardsLoading}
          >
            <option value="">Todos os cartões</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </Select>
        </label>

        <label className={styles.filterField}>
          <span>Situação</span>
          <Select
            value={filters.status}
            onChange={(event) => {
              setFilters((current) => ({
                ...current,
                status: event.target.value as CreditCardInvoiceStatus | "",
              }));
              setPage(1);
            }}
          >
            <option value="">Todas</option>
            <option value="OPEN">Abertas</option>
            <option value="CLOSED">Fechadas</option>
            <option value="PAID">Pagas</option>
          </Select>
        </label>
      </div>

      {loading ? (
        <div className={styles.feedback}>Carregando faturas...</div>
      ) : error ? (
        <div className={styles.error} role="alert">
          <p>Não foi possível carregar as faturas.</p>
          <button type="button" onClick={() => void load()}>
            Tentar novamente
          </button>
        </div>
      ) : invoices.length === 0 ? (
        <div className={styles.empty}>
          <h3>Nenhuma fatura encontrada</h3>
          <p>
            As faturas serão exibidas aqui quando houver compras registradas nos cartões.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <span>Saldo restante das faturas desta página</span>
            <strong>{formatCurrency(totalRemaining)}</strong>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cartão</th>
                  <th>Referência</th>
                  <th>Vencimento</th>
                  <th>Compras</th>
                  <th>Valor total</th>
                  <th>Valor pago</th>
                  <th>Restante</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <strong className={styles.cardName}>
                        {invoice.creditCard.name}
                      </strong>
                      {invoice.creditCard.lastFourDigits && (
                        <span className={styles.cardDigits}>
                          •••• {invoice.creditCard.lastFourDigits}
                        </span>
                      )}
                    </td>

                    <td className={styles.reference}>
                      {formatReferenceMonth(invoice.referenceMonth)}
                    </td>

                    <td>{formatDate(invoice.dueDate)}</td>

                    <td>
                      {invoice.indicators.purchaseCount}
                      <span className={styles.muted}>
                        {" "}
                        ({invoice.indicators.installmentCount} parcelas)
                      </span>
                    </td>

                    <td>{formatCurrency(invoice.indicators.totalAmount)}</td>
                    <td>{formatCurrency(invoice.indicators.paidAmount)}</td>

                    <td className={styles.remaining}>
                      {formatCurrency(invoice.indicators.remainingAmount)}
                    </td>

                    <td>
                      <span
                        className={`${styles.status} ${styles[`status${invoice.status}`]}`}
                      >
                        {STATUS_LABELS[invoice.status] ?? invoice.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className={styles.detailsButton}
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className={styles.pagination} aria-label="Paginação de faturas">
            <span>
              Página {pagination.page} de {totalPages} · {pagination.total} faturas
            </span>

            <div className={styles.paginationActions}>
              <button
                type="button"
                className={styles.paginationButton}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
              >
                Anterior
              </button>

              <button
                type="button"
                className={styles.paginationButton}
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= totalPages || loading}
              >
                Próxima
              </button>
            </div>
          </nav>
        </>
      )}

      <CreditCardInvoiceDetailsModal
        open={selectedInvoice !== null}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onUpdated={load}
      />
    </section>
  );
}
