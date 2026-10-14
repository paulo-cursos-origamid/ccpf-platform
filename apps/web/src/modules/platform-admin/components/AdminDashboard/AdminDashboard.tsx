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
      value: data ? (data.users ? String(data.users.total) : "Sem acesso") : "0",
      description: data
        ? data.users
          ? `${data.users.active} ativos · ${data.users.inactive} inativos`
          : "Métricas indisponíveis para seu perfil."
        : "Usuários cadastrados na plataforma.",
      icon: Users,
      href: "/dashboard/users",
    },
    {
      label: "Espaços",
      value: data ? (data.tenants ? String(data.tenants.total) : "Sem acesso") : "0",
      description: data
        ? data.tenants
          ? `${data.tenants.active} ativos · ${data.tenants.suspended} suspensos`
          : "Métricas indisponíveis para seu perfil."
        : "Organizações cadastradas na plataforma.",
      icon: Building2,
    },
    {
      label: "Assinaturas",
      value: data
        ? (data.subscriptions ? String(data.subscriptions.active) : "Sem acesso")
        : "0",
      description: data
        ? data.subscriptions
          ? `${data.subscriptions.trialing} em trial · ${data.subscriptions.pastDue} em atraso`
          : "Métricas indisponíveis para seu perfil."
        : "Assinaturas ativas e em acompanhamento.",
      icon: CreditCard,
      href: "/admin/billing/invoices",
    },
    {
      label: "Recebido",
      value: data
        ? (data.billing ? formatCurrency(data.billing.received.amount) : "Sem acesso")
        : "R$ 0,00",
      description: data
        ? data.billing
          ? `${data.billing.received.count} pagamentos confirmados`
          : "Métricas indisponíveis para seu perfil."
        : "Pagamentos confirmados na plataforma.",
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
