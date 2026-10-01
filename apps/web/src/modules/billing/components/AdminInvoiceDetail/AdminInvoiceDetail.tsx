"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

import { useAdminInvoice, useConfirmPayment } from "../../hooks/client";
import type { InvoiceStatus } from "../../types";
import styles from "./AdminInvoiceDetail.module.scss";

interface AdminInvoiceDetailProps {
  invoiceId: string;
}

const statusLabels: Record<InvoiceStatus, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
};

const statusClasses: Record<InvoiceStatus, string> = {
  PENDING: styles.statusPending,
  PAID: styles.statusPaid,
  OVERDUE: styles.statusOverdue,
  CANCELLED: styles.statusCancelled,
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getPaymentStatusLabel(status: string): string {
  switch (status) {
    case "PAID":
      return "Pago";
    case "PENDING":
      return "Pendente";
    case "EXPIRED":
      return "Expirado";
    case "CANCELLED":
      return "Cancelado";
    case "FAILED":
      return "Falhou";
    default:
      return status;
  }
}

export function AdminInvoiceDetail({
  invoiceId,
}: AdminInvoiceDetailProps) {
  const { invoice, loading, error, reload } = useAdminInvoice(invoiceId);
  const {
    confirm,
    loading: confirmingPayment,
    error: confirmationError,
  } = useConfirmPayment();

  const handleConfirmPayment = async (paymentId: string) => {
    const confirmed = window.confirm(
      "Confirma que este pagamento foi recebido e deve ser marcado como pago?",
    );

    if (!confirmed) {
      return;
    }

    const success = await confirm(paymentId);

    if (success) {
      await reload();
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.loadingBlock} />
          <div className={styles.loadingBlock} />
          <div className={styles.loadingBlock} />
        </div>
      </section>
    );
  }

  if (error || !invoice) {
    return (
      <section className={styles.page}>
        <Link href="/admin/billing/invoices" className={styles.backLink}>
          <ArrowLeft size={18} />
          Voltar para faturas
        </Link>

        <div className={styles.error}>
          <h1>Fatura não encontrada</h1>
          <p>
            {error ?? "Não foi possível carregar os dados desta fatura."}
          </p>
        </div>
      </section>
    );
  }

  const statusLabel = statusLabels[invoice.status] ?? invoice.status;
  const statusClass = statusClasses[invoice.status] ?? styles.statusPending;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <Link href="/admin/billing/invoices" className={styles.backLink}>
          <ArrowLeft size={18} />
          Voltar para faturas
        </Link>

        <div className={styles.breadcrumb}>
          <span>Administração</span>
          <ChevronRight size={14} />
          <span>Faturamento</span>
          <ChevronRight size={14} />
          <span>Fatura</span>
        </div>

        <div className={styles.titleRow}>
          <div>
            <p className={styles.eyebrow}>Fatura administrativa</p>
            <h1>{invoice.number}</h1>
          </div>

          <span className={`${styles.status} ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Valor</span>
          <strong className={styles.amount}>
            {formatCurrency(invoice.amount, invoice.currency)}
          </strong>
          <span className={styles.cardMeta}>
            {invoice.currency}
          </span>
        </article>

        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Vencimento</span>
          <strong>{formatDate(invoice.dueAt)}</strong>
          <span className={styles.cardMeta}>
            <CalendarDays size={15} />
            {invoice.paidAt
              ? `Paga em ${formatDate(invoice.paidAt)}`
              : "Ainda não paga"}
          </span>
        </article>

        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Tenant</span>
          <strong>{invoice.tenant.name}</strong>
          <span className={styles.cardMeta}>
            {invoice.tenant.slug}
          </span>
        </article>

        <article className={styles.summaryCard}>
          <span className={styles.cardLabel}>Plano</span>
          <strong>{invoice.subscription.plan.name}</strong>
          <span className={styles.cardMeta}>
            {invoice.subscription.plan.code}
          </span>
        </article>
      </div>

      <div className={styles.contentGrid}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.eyebrow}>Contexto da cobrança</p>
              <h2>Assinatura</h2>
            </div>
          </div>

          <dl className={styles.details}>
            <div>
              <dt>Plano</dt>
              <dd>{invoice.subscription.plan.name}</dd>
            </div>

            <div>
              <dt>Código do plano</dt>
              <dd>{invoice.subscription.plan.code}</dd>
            </div>

            <div>
              <dt>Status da assinatura</dt>
              <dd>{invoice.subscription.status}</dd>
            </div>

            <div>
              <dt>Início</dt>
              <dd>{formatDate(invoice.subscription.startedAt)}</dd>
            </div>

            <div>
              <dt>Início do período</dt>
              <dd>
                {formatDate(invoice.subscription.currentPeriodStart)}
              </dd>
            </div>

            <div>
              <dt>Fim do período</dt>
              <dd>
                {formatDate(invoice.subscription.currentPeriodEnd)}
              </dd>
            </div>

            <div>
              <dt>Preço do plano</dt>
              <dd>
                {formatCurrency(
                  invoice.subscription.plan.price,
                  invoice.subscription.plan.currency,
                )}
              </dd>
            </div>

            <div>
              <dt>Intervalo</dt>
              <dd>{invoice.subscription.plan.billingInterval}</dd>
            </div>
          </dl>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.eyebrow}>Identificação</p>
              <h2>Dados da fatura</h2>
            </div>
          </div>

          <dl className={styles.details}>
            <div>
              <dt>Número</dt>
              <dd>{invoice.number}</dd>
            </div>

            <div>
              <dt>Valor</dt>
              <dd>
                {formatCurrency(invoice.amount, invoice.currency)}
              </dd>
            </div>

            <div>
              <dt>ID da fatura</dt>
              <dd className={styles.mono}>{invoice.id}</dd>
            </div>

            <div>
              <dt>ID do Tenant</dt>
              <dd className={styles.mono}>{invoice.tenantId}</dd>
            </div>

            <div>
              <dt>ID da assinatura</dt>
              <dd className={styles.mono}>
                {invoice.subscriptionId}
              </dd>
            </div>

            <div>
              <dt>Moeda</dt>
              <dd>{invoice.currency}</dd>
            </div>

            <div>
              <dt>Criada em</dt>
              <dd>{formatDateTime(invoice.createdAt)}</dd>
            </div>

            <div>
              <dt>Atualizada em</dt>
              <dd>{formatDateTime(invoice.updatedAt)}</dd>
            </div>

            <div>
              <dt>Pagamento</dt>
              <dd>{formatDateTime(invoice.paidAt)}</dd>
            </div>

            <div>
              <dt>Vencimento</dt>
              <dd>{formatDateTime(invoice.dueAt)}</dd>
            </div>
          </dl>
        </article>
      </div>

      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.eyebrow}>Histórico financeiro</p>
            <h2>Pagamentos</h2>
          </div>

          <span className={styles.paymentCount}>
            {invoice.payments.length}{" "}
            {invoice.payments.length === 1
              ? "pagamento"
              : "pagamentos"}
          </span>
        </div>

        {confirmationError && (
          <div className={styles.confirmationError}>
            {confirmationError}
          </div>
        )}

        {invoice.payments.length === 0 ? (
          <div className={styles.empty}>
            Nenhum pagamento registrado para esta fatura.
          </div>
        ) : (
          <div className={styles.paymentList}>
            {invoice.payments.map((payment) => (
              <div key={payment.id} className={styles.paymentRow}>
                <div className={styles.paymentMain}>
                  <strong>{payment.reference}</strong>
                  <span>
                    {payment.method} ·{" "}
                    {payment.provider ?? "Sem provedor"}
                  </span>
                </div>

                <div className={styles.paymentAmount}>
                  <strong>
                    {formatCurrency(
                      payment.amount,
                      payment.currency,
                    )}
                  </strong>
                  <span>
                    {getPaymentStatusLabel(payment.status)}
                  </span>
                </div>

                <div className={styles.paymentDate}>
                  <span>Pago em</span>
                  <strong>{formatDateTime(payment.paidAt)}</strong>
                </div>

                {payment.status === "PENDING" && (
                  <button
                    type="button"
                    className={styles.confirmButton}
                    onClick={() => void handleConfirmPayment(payment.id)}
                    disabled={confirmingPayment}
                  >
                    {confirmingPayment ? (
                      <>
                        <Loader2
                          size={15}
                          className={styles.spinner}
                        />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        Confirmar pagamento
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
