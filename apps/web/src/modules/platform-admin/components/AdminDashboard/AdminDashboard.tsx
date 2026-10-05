"use client";

import {
  Building2,
  CreditCard,
  Receipt,
  Users,
} from "lucide-react";

import { useAdminDashboardSummary } from "../../hooks";
import { AdminMetricCard } from "./AdminMetricCard";
import { AdminQuickActions } from "./AdminQuickActions/AdminQuickActions";

import styles from "./AdminDashboard.module.scss";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function AdminDashboard() {
  const { data, loading, error, reload } =
    useAdminDashboardSummary();

  const metrics = [
    {
      label: "Usuários",
      value: data ? String(data.users.total) : "0",
      description: data
        ? `${data.users.active} ativos · ${data.users.inactive} inativos`
        : "Usuários cadastrados na plataforma.",
      icon: Users,
      href: "/dashboard/users",
    },
    {
      label: "Tenants",
      value: data ? String(data.tenants.total) : "0",
      description: data
        ? `${data.tenants.active} ativos · ${data.tenants.suspended} suspensos`
        : "Organizações cadastradas na plataforma.",
      icon: Building2,
    },
    {
      label: "Assinaturas",
      value: data ? String(data.subscriptions.active) : "0",
      description: data
        ? `${data.subscriptions.trialing} em trial · ${data.subscriptions.pastDue} em atraso`
        : "Assinaturas ativas e em acompanhamento.",
      icon: CreditCard,
      href: "/admin/billing/invoices",
    },
    {
      label: "Faturamento",
      value: data
        ? formatCurrency(data.billing.paid.amount)
        : "R$ 0,00",
      description: data
        ? `${data.billing.paid.count} faturas pagas`
        : "Faturas e pagamentos da plataforma.",
      icon: Receipt,
      href: "/admin/billing/invoices",
    },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            Platform Admin
          </span>

          <h1 className={styles.title}>Dashboard</h1>

          <p className={styles.description}>
            Visão geral da operação e dos principais recursos
            administrativos da plataforma.
          </p>
        </div>
      </header>

      {error ? (
        <section className={styles.error}>
          <div>
            <strong>Não foi possível carregar o dashboard.</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void reload()}
          >
            Tentar novamente
          </button>
        </section>
      ) : null}

      <section
        className={styles.metrics}
        aria-label="Resumo administrativo"
      >
        {metrics.map((metric) => (
          <AdminMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            href={metric.href}
            loading={loading}
          />
        ))}
      </section>

      <AdminQuickActions />
    </main>
  );
}
