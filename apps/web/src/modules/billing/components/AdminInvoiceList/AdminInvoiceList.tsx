"use client";

import { useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";

import { Button, SearchInput } from "@/components/ui/forms";

import { InvoiceStatusBadge } from "../InvoiceStatusBadge/InvoiceStatusBadge";
import { useAdminInvoices } from "../../hooks";
import type {
  AdminInvoiceListParams,
  AdminInvoiceListResponse,
} from "../../types";

import styles from "./AdminInvoiceList.module.scss";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Pago" },
  { value: "OVERDUE", label: "Vencida" },
  { value: "CANCELLED", label: "Cancelada" },
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(amount);
}

function getPaymentLabel(
  invoice: AdminInvoiceListResponse["invoices"][number],
) {
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

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleClearSearch() {
    setSearch("");
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatus(
      value as NonNullable<AdminInvoiceListParams["status"]> | "",
    );
    setPage(1);
  }

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
        <div className={styles.searchWrapper}>
          <SearchInput
            className={styles.searchInput}
            value={search}
            placeholder="Buscar por número ou tenant..."
            aria-label="Buscar faturas por número ou tenant"
            leftIcon={
              <Search
                size={18}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            }
            rightIcon={
              search ? (
                <button
                  type="button"
                  className={styles.clearSearchButton}
                  aria-label="Limpar busca"
                  title="Limpar busca"
                  onClick={handleClearSearch}
                >
                  <X size={16} strokeWidth={1.8} />
                </button>
              ) : undefined
            }
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </div>

        <label className={styles.statusField}>
          <span className={styles.srOnly}>Filtrar por status</span>

          <select
            value={status}
            aria-label="Filtrar faturas por status"
            onChange={(event) => handleStatusChange(event.target.value)}
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

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={reload}
                      >
                        Tentar novamente
                      </Button>
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
                      <strong className={styles.amount}>
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
