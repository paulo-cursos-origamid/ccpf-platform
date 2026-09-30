"use client";

import { useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Search,
} from "@/components/icons";

import { useAdminInvoices } from "../../hooks/client";
import type {
  AdminInvoice,
  AdminInvoiceListParams,
} from "../../types";
import { InvoiceStatusBadge } from "../InvoiceStatusBadge/InvoiceStatusBadge";

import styles from "./AdminInvoiceList.module.scss";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: Array<{
  value: NonNullable<AdminInvoiceListParams["status"]> | "";
  label: string;
}> = [
  { value: "", label: "Todos os status" },
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Paga" },
  { value: "OVERDUE", label: "Vencida" },
  { value: "CANCELLED", label: "Cancelada" },
];

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

function getPaymentLabel(invoice: AdminInvoice) {
  if (!invoice.latestPayment) {
    return "Sem pagamento";
  }

  switch (invoice.latestPayment.status) {
    case "PAID":
      return "Pago";
    case "PENDING":
      return "Pendente";
    case "FAILED":
      return "Falhou";
    case "CANCELLED":
      return "Cancelado";
    default:
      return invoice.latestPayment.status;
  }
}

function LoadingRows() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index}>
      <td colSpan={8}>
        <div className={styles.loadingRow} />
      </td>
    </tr>
  ));
}

/**
 * Lista global de faturas para o painel administrativo.
 *
 * Permite busca, filtro por status, paginação e navegação para
 * o detalhe administrativo de cada fatura.
 */
export function AdminInvoiceList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    NonNullable<AdminInvoiceListParams["status"]> | ""
  >("");
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useAdminInvoices({
    page,
    limit: PAGE_SIZE,
    search,
    status: status || undefined,
  });

  const invoices = data?.invoices ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Faturamento</span>
          <h1 className={styles.title}>Faturas</h1>
          <p className={styles.description}>
            Consulte e acompanhe as faturas de todos os tenants da plataforma.
          </p>
        </div>
      </div>

      <div className={styles.filters}>
        <label className={styles.searchField}>
          <span className={styles.srOnly}>Buscar fatura</span>
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={search}
            placeholder="Buscar por número ou tenant..."
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>

        <label className={styles.statusField}>
          <span className={styles.srOnly}>Filtrar por status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value as
                  | NonNullable<AdminInvoiceListParams["status"]>
                  | "",
              );
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fatura</th>
                <th>Tenant</th>
                <th>Plano</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Pagamento</th>
                <th aria-label="Ações" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <LoadingRows />
              ) : error ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.feedback}>
                      <strong>Não foi possível carregar as faturas.</strong>
                      <span>{error}</span>
                      <button type="button" onClick={reload}>
                        Tentar novamente
                      </button>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.feedback}>
                      <strong>Nenhuma fatura encontrada.</strong>
                      <span>
                        Ajuste os filtros ou tente realizar uma nova busca.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <div className={styles.invoiceCell}>
                        <strong>{invoice.number}</strong>
                        <span>
                          Criada em {formatDate(invoice.createdAt)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className={styles.tenantCell}>
                        <strong>{invoice.tenant.name}</strong>
                        <span>{invoice.tenant.slug}</span>
                      </div>
                    </td>

                    <td>
                      <div className={styles.planCell}>
                        <strong>{invoice.subscription.plan.name}</strong>
                        <span>{invoice.subscription.plan.code}</span>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </strong>
                    </td>

                    <td>
                      <div className={styles.dateCell}>
                        <CalendarDays size={15} aria-hidden="true" />
                        <span>{formatDate(invoice.dueAt)}</span>
                      </div>
                    </td>

                    <td>
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>

                    <td>
                      <span className={styles.paymentStatus}>
                        {getPaymentLabel(invoice)}
                      </span>
                    </td>

                    <td>
                      <Link
                        href={`/admin/billing/invoices/${invoice.id}`}
                        className={styles.detailsLink}
                        aria-label={`Ver detalhes da fatura ${invoice.number}`}
                      >
                        <span>Detalhes</span>
                        <ChevronRight size={16} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading &&
          !error &&
          pagination &&
          pagination.total > 0 && (
            <div className={styles.pagination}>
              <span>
                Página {pagination.page} de {totalPages} · {pagination.total}{" "}
                fatura
                {pagination.total === 1 ? "" : "s"}
              </span>

              <div className={styles.paginationActions}>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={page <= 1}
                  aria-label="Página anterior"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1),
                    )
                  }
                  disabled={page >= totalPages}
                  aria-label="Próxima página"
                >
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
      </div>
    </section>
  );
}
