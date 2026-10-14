"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Receipt,
  XCircle,
} from "lucide-react";

import { InvoicePayment } from "../InvoicePayment";
import { InvoiceStatusBadge } from "../InvoiceStatusBadge/InvoiceStatusBadge";
import { useInvoice } from "../../hooks";
import type { InvoiceStatus, Payment } from "../../types";

import styles from "./InvoiceDetails.module.scss";

interface InvoiceDetailsProps {
  /**
   * Identificador da invoice exibida na página de detalhes.
   *
   * O componente recebe o ID explicitamente para manter o contrato
   * com a página de rota e permanecer reutilizável fora do contexto
   * direto do App Router.
   */
  invoiceId: string;
}

/**
 * Responsabilidade:
 * Exibir os dados detalhados da invoice e disponibilizar o fluxo
 * de pagamento para invoices pendentes ou vencidas.
 */
export function InvoiceDetails({ invoiceId }: InvoiceDetailsProps) {
  const { invoice, loading, error, reload } = useInvoice(invoiceId);

  if (loading) {
    return (
      <section className={styles.container} aria-busy="true">
        <div className={styles.backLinkSkeleton} />

        <div className={styles.loadingCard}>
          <div className={styles.loadingHeader}>
            <div className={styles.loadingIcon} />
            <div className={styles.loadingTitle}>
              <span />
              <strong />
            </div>
            <div className={styles.loadingStatus} />
          </div>

          <div className={styles.loadingMain}>
            <span />
            <strong />
          </div>

          <div className={styles.loadingGrid}>
            <div className={styles.loadingItem} />
            <div className={styles.loadingItem} />
            <div className={styles.loadingItem} />
            <div className={styles.loadingItem} />
            <div className={styles.loadingItem} />
            <div className={styles.loadingItem} />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Não foi possível carregar os detalhes da fatura.";

    return (
      <section className={styles.container}>
        <Link href="/settings/billing" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para cobrança
        </Link>

        <div className={styles.feedbackError} role="alert">
          <div className={styles.feedbackContent}>
            <div className={styles.feedbackIcon}>
              <XCircle size={18} aria-hidden="true" />
            </div>

            <div>
              <strong>Não foi possível carregar a fatura</strong>
              <span>{errorMessage}</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void reload()}
          >
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  if (!invoice) {
    return (
      <section className={styles.container}>
        <Link href="/settings/billing" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para cobrança
        </Link>

        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Receipt size={22} aria-hidden="true" />
          </div>

          <strong>Fatura não encontrada</strong>
          <span>
            A fatura solicitada não está disponível ou não existe mais.
          </span>
        </div>
      </section>
    );
  }

  const canPay =
    invoice.status === "PENDING" || invoice.status === "OVERDUE";

  const isPaid = invoice.status === "PAID";
  const isCancelled = invoice.status === "CANCELLED";

  const paymentHistory = (invoice.installments ?? [])
    .flatMap((installment) =>
      (installment.payments ?? []).map((payment) => ({
        ...payment,
        installmentNumber: installment.number,
      })),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const paymentStatusLabels: Record<Payment["status"], string> = {
    PENDING: "Aguardando confirmação",
    PROCESSING: "Em processamento",
    PAID: "Confirmado",
    FAILED: "Falhou",
    REFUNDED: "Estornado",
    CANCELLED: "Tentativa cancelada",
  };

  const paymentMethodLabels: Record<Payment["method"], string> = {
    PIX: "PIX",
    BANK_SLIP: "Boleto bancário",
  };

  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: invoice.currency,
  }).format(invoice.amount);

  const formattedDueDate = new Intl.DateTimeFormat("pt-BR").format(
    new Date(invoice.dueAt),
  );

  const formattedCreatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(invoice.createdAt));

  const formattedPaidAt = invoice.paidAt
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(invoice.paidAt))
    : null;

  return (
    <section className={styles.container}>
      <Link href="/settings/billing" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar para cobrança
      </Link>

      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.invoiceIcon}>
            <Receipt size={21} strokeWidth={1.9} aria-hidden="true" />
          </div>

          <div className={styles.titleGroup}>
            <span className={styles.eyebrow}>Fatura</span>
            <h1 className={styles.title}>{invoice.number}</h1>
            <p>Detalhes da cobrança e informações de pagamento.</p>
          </div>
        </div>

        <div className={styles.headerStatus}>
          <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon}>
              <FileText size={18} aria-hidden="true" />
            </div>

            <div>
              <h2>Detalhes da fatura</h2>
              <p>Confira os dados desta cobrança.</p>
            </div>
          </div>

          <div className={styles.amountSection}>
            <div>
              <span className={styles.amountLabel}>Valor da fatura</span>
              <strong className={styles.amount}>{formattedAmount}</strong>
            </div>

            <div className={styles.dueDate}>
              <span className={styles.amountLabel}>Vencimento</span>
              <strong>{formattedDueDate}</strong>
            </div>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <FileText size={16} aria-hidden="true" />
              </div>

              <div className={styles.detailContent}>
                <span>Número</span>
                <strong className={styles.identifier}>
                  {invoice.number}
                </strong>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <CreditCard size={16} aria-hidden="true" />
              </div>

              <div className={styles.detailContent}>
                <span>Moeda</span>
                <strong>{invoice.currency}</strong>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <CalendarDays size={16} aria-hidden="true" />
              </div>

              <div className={styles.detailContent}>
                <span>Vencimento</span>
                <strong>{formattedDueDate}</strong>
              </div>
            </div>

            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <Receipt size={16} aria-hidden="true" />
              </div>

              <div className={styles.detailContent}>
                <span>Status</span>
                <InvoiceStatusBadge
                  status={invoice.status as InvoiceStatus}
                />
              </div>
            </div>

            {formattedPaidAt && (
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <CheckCircle2 size={16} aria-hidden="true" />
                </div>

                <div className={styles.detailContent}>
                  <span>Pagamento</span>
                  <strong>{formattedPaidAt}</strong>
                </div>
              </div>
            )}

            <div className={styles.detailItem}>
              <div className={styles.detailIcon}>
                <CalendarDays size={16} aria-hidden="true" />
              </div>

              <div className={styles.detailContent}>
                <span>Criada em</span>
                <strong>{formattedCreatedAt}</strong>
              </div>
            </div>
          </div>
        </div>

        {canPay && <InvoicePayment invoice={invoice} />}

        <section className={styles.paymentHistory} aria-labelledby="payment-history-title">
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon}>
              <CreditCard size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 id="payment-history-title">Histórico de pagamentos</h2>
              <p>Acompanhe as tentativas e a situação de cada pagamento.</p>
            </div>
          </div>

          {paymentHistory.length === 0 ? (
            <p className={styles.paymentHistoryEmpty}>
              Ainda não há tentativas de pagamento para esta fatura.
            </p>
          ) : (
            <div className={styles.paymentHistoryList}>
              {paymentHistory.map((payment) => (
                <article className={styles.paymentHistoryItem} key={payment.id}>
                  <div className={styles.paymentHistoryMain}>
                    <strong>{paymentMethodLabels[payment.method] ?? payment.method}</strong>
                    <span>Parcela {payment.installmentNumber}</span>
                    <span>Referência: {payment.reference}</span>
                  </div>
                  <div className={styles.paymentHistoryDetails}>
                    <strong>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: payment.currency,
                      }).format(payment.amount)}
                    </strong>
                    <span className={`${styles.paymentStatus} ${styles[`paymentStatus_${payment.status}`]}`}>
                      {paymentStatusLabels[payment.status] ?? payment.status}
                    </span>
                    <span>
                      Tentativa: {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short", timeStyle: "short",
                      }).format(new Date(payment.createdAt))}
                    </span>
                    {payment.paidAt && (
                      <span>
                        Pago em: {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short", timeStyle: "short",
                        }).format(new Date(payment.paidAt))}
                      </span>
                    )}
                    {payment.expiresAt && (
                      <span>
                        Expira em: {new Intl.DateTimeFormat("pt-BR", {
                          dateStyle: "short", timeStyle: "short",
                        }).format(new Date(payment.expiresAt))}
                      </span>
                    )}
                    {payment.status === "CANCELLED" && payment.cancellationReason && (
                      <span>
                        <strong>Motivo do cancelamento:</strong>{" "}
                        {payment.cancellationReason}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {isPaid && (
          <div className={`${styles.statusNotice} ${styles.successNotice}`}>
            <div className={styles.noticeIcon}>
              <CheckCircle2 size={19} aria-hidden="true" />
            </div>

            <div>
              <strong>Fatura paga</strong>
              <p>
                Esta fatura já foi confirmada como paga. Não é necessário
                realizar um novo pagamento.
              </p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className={`${styles.statusNotice} ${styles.cancelledNotice}`}>
            <div className={styles.noticeIcon}>
              <XCircle size={19} aria-hidden="true" />
            </div>

            <div>
              <strong>Fatura cancelada</strong>
              <p>
                Esta fatura não está mais disponível para pagamento.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
