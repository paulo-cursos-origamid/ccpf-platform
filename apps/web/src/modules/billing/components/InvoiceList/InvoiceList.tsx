"use client";

import Link from "next/link";

import { ArrowRight, CalendarDays } from "@/components/icons";

import { useTenantInvoices } from "../../hooks";
import type { Invoice } from "../../types";
import { InvoiceStatusBadge } from "../InvoiceStatusBadge/InvoiceStatusBadge";

import styles from "./InvoiceList.module.scss";

/**
 * Formata valores monetários utilizando a moeda informada pela API.
 */
function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Formata uma data recebida da API.
 */
function formatDate(date: string | null): string {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsedDate);
}

/**
 * Componente responsável pela apresentação do histórico
 * de faturas do Tenant ativo.
 */
export function InvoiceList() {
  const { invoices, loading, error, reload } = useTenantInvoices();

  if (loading) {
    return (
      <div className={styles.loadingCard} aria-label="Carregando cobranças">
        <div className={styles.loadingRow} />
        <div className={styles.loadingRow} />
        <div className={styles.loadingRow} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.feedbackError}>
        <div>
          <strong>Não foi possível carregar as cobranças.</strong>

          <span>Tente novamente para consultar o histórico deste Espaço.</span>
        </div>

        <button
          type="button"
          className={styles.retryButton}
          onClick={() => void reload()}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className={styles.emptyState}>
        <CalendarDays size={24} />

        <strong>Nenhuma cobrança encontrada</strong>

        <span>As faturas geradas para este Espaço aparecerão aqui.</span>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.list}>
        {invoices.map((invoice) => (
          <InvoiceRow key={invoice.id} invoice={invoice} />
        ))}
      </div>
    </div>
  );
}

interface InvoiceRowProps {
  invoice: Invoice;
}

/**
 * Linha individual de uma fatura.
 *
 * Apresenta os principais dados da cobrança e disponibiliza
 * a navegação para a página de detalhes da fatura.
 */
function InvoiceRow({ invoice }: InvoiceRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.number}>
        <div className={styles.icon}>
          <CalendarDays size={17} />
        </div>

        <div>
          <span className={styles.label}>Fatura</span>

          <strong>{invoice.number}</strong>
        </div>
      </div>

      <div className={styles.amount}>
        <span className={styles.label}>Valor</span>

        <strong>{formatCurrency(invoice.amount, invoice.currency)}</strong>
      </div>

      <div className={styles.status}>
        <span className={styles.label}>Status</span>

        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className={styles.date}>
        <span className={styles.label}>Vencimento</span>

        <div className={styles.dateValue}>
          <CalendarDays size={15} />

          <span>{formatDate(invoice.dueAt)}</span>
        </div>
      </div>

      <div className={styles.date}>
        <span className={styles.label}>Pagamento</span>

        <div className={styles.dateValue}>
          <CalendarDays size={15} />

          <span>{formatDate(invoice.paidAt)}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Link
          href={`/settings/billing/invoices/${invoice.id}`}
          className={styles.detailsLink}
        >
          <span>Ver detalhes</span>

          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
