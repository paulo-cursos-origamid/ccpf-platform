"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  Receipt,
} from "@/components/icons";

import { useInvoice } from "../../hooks";
import { InvoicePayment } from "../InvoicePayment/InvoicePayment";
import { InvoiceStatusBadge } from "../InvoiceStatusBadge/InvoiceStatusBadge";

import styles from "./InvoiceDetails.module.scss";

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
 * Formata uma data com data e horário para informações
 * técnicas da fatura.
 */
function formatDateTime(date: string | null): string {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
}

/**
 * Componente responsável pela apresentação dos detalhes
 * de uma fatura específica.
 *
 * A busca dos dados fica encapsulada no hook useInvoice.
 * Este componente não contém regras de comunicação com a API.
 */
export function InvoiceDetails({
  invoiceId,
}: {
  invoiceId: string;
}) {
  const { invoice, loading, error, reload } = useInvoice(invoiceId);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.backLinkSkeleton} />
        <div className={styles.loadingCard}>
          <div className={styles.loadingHeader} />
          <div className={styles.loadingGrid}>
            <div className={styles.loadingItem} />
            <div className={styles.loadingItem} />
            <div className={styles.loadingItem} />
            <div className={styles.loadingItem} />
            <div className={styles.loadingItem} />
            <div className={styles.loadingItem} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className={styles.container}>
        <Link
          href="/settings/billing"
          className={styles.backLink}
        >
          <ArrowLeft size={16} />
          <span>Voltar para cobranças</span>
        </Link>

        <div className={styles.feedbackError}>
          <div>
            <strong>Não foi possível carregar a fatura.</strong>

            <span>
              Verifique se a cobrança existe e tente novamente.
            </span>
          </div>

          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link
        href="/settings/billing"
        className={styles.backLink}
      >
        <ArrowLeft size={16} />
        <span>Voltar para cobranças</span>
      </Link>

      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.icon}>
              <Receipt size={21} />
            </div>

            <div>
              <span className={styles.eyebrow}>Fatura</span>

              <h1>{invoice.number}</h1>

              <p>
                Detalhes da cobrança deste Espaço.
              </p>
            </div>
          </div>

          <InvoiceStatusBadge status={invoice.status} />
        </header>

        <div className={styles.mainInfo}>
          <div className={styles.amountBlock}>
            <span className={styles.label}>Valor da cobrança</span>

            <strong>
              {formatCurrency(invoice.amount, invoice.currency)}
            </strong>
          </div>

          <div className={styles.currencyBlock}>
            <span className={styles.label}>Moeda</span>

            <strong>{invoice.currency}</strong>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <DetailItem
            icon={<CalendarDays size={17} />}
            label="Vencimento"
            value={formatDate(invoice.dueAt)}
          />

          <DetailItem
            icon={<CreditCard size={17} />}
            label="Pagamento"
            value={formatDate(invoice.paidAt)}
          />

          <DetailItem
            icon={<FileText size={17} />}
            label="Assinatura"
            value={invoice.subscriptionId}
            valueClassName={styles.identifier}
          />

          <DetailItem
            icon={<CalendarDays size={17} />}
            label="Criada em"
            value={formatDateTime(invoice.createdAt)}
          />

          <DetailItem
            icon={<CalendarDays size={17} />}
            label="Atualizada em"
            value={formatDateTime(invoice.updatedAt)}
          />

          <DetailItem
            icon={<Receipt size={17} />}
            label="Identificador"
            value={invoice.id}
            valueClassName={styles.identifier}
          />
        </div>
      </section>

      {invoice.status === "PENDING" ||
      invoice.status === "OVERDUE" ? (
        <InvoicePayment
          invoiceId={invoice.id}
          amount={invoice.amount}
          currency={invoice.currency}
        />
      ) : null}
    </div>
  );
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}

/**
 * Apresenta um campo individual da fatura.
 */
function DetailItem({
  icon,
  label,
  value,
  valueClassName,
}: DetailItemProps) {
  return (
    <div className={styles.detailItem}>
      <div className={styles.detailIcon}>{icon}</div>

      <div className={styles.detailContent}>
        <span>{label}</span>

        <strong className={valueClassName}>{value}</strong>
      </div>
    </div>
  );
}
