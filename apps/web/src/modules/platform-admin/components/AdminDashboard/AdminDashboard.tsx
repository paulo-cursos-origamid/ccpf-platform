"use client";

import type { ReactNode } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Building2,
  CreditCard,
  Receipt,
  Users,
} from "@/components/icons";

import { useAdminDashboardSummary } from "../../hooks";
import { AdminQuickActions } from "./AdminQuickActions/AdminQuickActions";

import styles from "./AdminDashboard.module.scss";

interface ChartPanelProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  label?: string;
}

function ChartPanel({
  title,
  description,
  children,
  className,
  label,
}: ChartPanelProps) {
  return (
    <section className={`${styles.chartPanel} ${className ?? ""}`}>
      <header className={styles.chartHeader}>
        <div>
          {label ? <span className={styles.chartEyebrow}>{label}</span> : null}
          <h2 className={styles.chartTitle}>{title}</h2>
          <p className={styles.chartDescription}>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function ChartEmptyState({ loading }: { loading: boolean }) {
  return (
    <div className={styles.chartEmpty}>
      <span className={styles.emptyIcon}>—</span>
      <span>
        {loading
          ? "Carregando indicadores..."
          : "Dados indisponíveis para este perfil."}
      </span>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMetricCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const CHART_COLORS = {
  primary: "#047857",
  secondary: "#10b981",
  gold: "#fbb755",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  red: "#ef4444",
  muted: "#64748b",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#0b1629",
  border: "1px solid #1e304b",
  borderRadius: "12px",
  color: "#f8fafc",
  fontSize: "12px",
  padding: "10px 14px",
};

const AXIS_TICK = {
  fill: "#94a3b8",
  fontSize: 11,
};

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  icon: typeof Users;
  color: string;
  href?: string;
  loading: boolean;
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  color,
  href,
  loading,
}: MetricCardProps) {
  const content = (
    <>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{label}</span>
        <span
          className={styles.metricIcon}
          style={{
            color,
            backgroundColor: `${color}18`,
            borderColor: `${color}30`,
          }}
        >
          <Icon size={19} />
        </span>
      </div>

      <div className={styles.metricValue}>
        {loading ? <span className={styles.skeleton} /> : value}
      </div>

      <p className={styles.metricDescription}>{description}</p>
    </>
  );

  return href ? (
    <a href={href} className={styles.metricCard}>
      {content}
    </a>
  ) : (
    <article className={styles.metricCard}>{content}</article>
  );
}

export function AdminDashboard() {
  const { data, loading, error, reload } = useAdminDashboardSummary();

  const users = data?.users;
  const tenants = data?.tenants;
  const subscriptions = data?.subscriptions;
  const billing = data?.billing;

  const metrics: MetricCardProps[] = [
    {
      label: "Usuários",
      value: users ? String(users.total) : data ? "Sem acesso" : "0",
      description: users
        ? `${users.active} ativos · ${users.inactive} inativos`
        : "Usuários cadastrados na plataforma.",
      icon: Users,
      color: CHART_COLORS.secondary,
      href: "/dashboard/users",
      loading,
    },
    {
      label: "Espaços",
      value: tenants ? String(tenants.total) : data ? "Sem acesso" : "0",
      description: tenants
        ? `${tenants.active} ativos · ${tenants.suspended} suspensos`
        : "Espaços cadastrados na plataforma.",
      icon: Building2,
      color: CHART_COLORS.blue,
      loading,
    },
    {
      label: "Assinaturas ativas",
      value: subscriptions
        ? String(subscriptions.active)
        : data
          ? "Sem acesso"
          : "0",
      description: subscriptions
        ? `${subscriptions.trialing} em trial · ${subscriptions.pastDue} em atraso`
        : "Situação das assinaturas.",
      icon: CreditCard,
      color: CHART_COLORS.purple,
      href: "/admin/billing/invoices",
      loading,
    },
    {
      label: "Recebido",
      value: billing
        ? formatMetricCurrency(billing.received.amount)
        : data
          ? "Sem acesso"
          : "R$ 0,00",
      description: billing
        ? `${billing.received.count} pagamentos confirmados`
        : "Pagamentos confirmados na plataforma.",
      icon: Receipt,
      color: CHART_COLORS.gold,
      href: "/admin/billing/invoices",
      loading,
    },
  ];

  const userChartData = users
    ? [
        { name: "Ativos", quantidade: users.active },
        { name: "Inativos", quantidade: users.inactive },
      ]
    : [];

  const tenantChartData = tenants
    ? [
        { name: "Ativos", quantidade: tenants.active },
        { name: "Suspensos", quantidade: tenants.suspended },
        { name: "Cancelados", quantidade: tenants.cancelled },
      ]
    : [];

  const subscriptionChartData = subscriptions
    ? [
        { name: "Ativas", value: subscriptions.active, color: CHART_COLORS.primary },
        { name: "Trial", value: subscriptions.trialing, color: CHART_COLORS.gold },
        { name: "Pendentes", value: subscriptions.pending, color: CHART_COLORS.blue },
        { name: "Em atraso", value: subscriptions.pastDue, color: CHART_COLORS.red },
        { name: "Suspensas", value: subscriptions.suspended, color: CHART_COLORS.purple },
        { name: "Canceladas", value: subscriptions.cancelled, color: CHART_COLORS.muted },
        { name: "Expiradas", value: subscriptions.expired, color: "#475569" },
      ]
    : [];

  const subscriptionTotal = subscriptionChartData.reduce(
    (total, item) => total + item.value,
    0,
  );

  const billingChartData = billing
    ? [
        { name: "Recebido", valor: billing.received.amount, color: CHART_COLORS.secondary },
        { name: "Pendente", valor: billing.pending.amount, color: CHART_COLORS.gold },
        { name: "Vencido", valor: billing.overdue.amount, color: CHART_COLORS.red },
      ]
    : [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Platform Admin</span>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.description}>
            Olá! Aqui está um resumo da operação e do desempenho da plataforma.
          </p>
        </div>
        <span className={styles.headerStatus}>
          <span className={styles.statusDot} />
          Visão administrativa
        </span>
      </header>

      {error ? (
        <section className={styles.error} role="alert">
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

      <section className={styles.metrics} aria-label="Resumo administrativo">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>Indicadores</span>
            <h2 className={styles.sectionTitle}>Visão da plataforma</h2>
            <p className={styles.sectionDescription}>
              Distribuição atual dos principais indicadores administrativos.
            </p>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <ChartPanel
            title="Usuários"
            description="Distribuição entre usuários ativos e inativos."
          >
            {users ? (
              <div className={styles.chart}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userChartData} barSize={42}>
                    <CartesianGrid
                      stroke="#26364d"
                      strokeDasharray="3 5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={AXIS_TICK}
                      axisLine={{ stroke: "#334155" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={AXIS_TICK}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: "#ffffff08" }}
                    />
                    <Bar
                      dataKey="quantidade"
                      name="Usuários"
                      fill={CHART_COLORS.primary}
                      radius={[7, 7, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState loading={loading} />
            )}
          </ChartPanel>

          <ChartPanel
            title="Espaços"
            description="Situação dos Espaços cadastrados na plataforma."
          >
            {tenants ? (
              <div className={styles.chart}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tenantChartData} barSize={38}>
                    <CartesianGrid
                      stroke="#26364d"
                      strokeDasharray="3 5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={AXIS_TICK}
                      axisLine={{ stroke: "#334155" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={AXIS_TICK}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: "#ffffff08" }}
                    />
                    <Bar
                      dataKey="quantidade"
                      name="Espaços"
                      radius={[7, 7, 0, 0]}
                    >
                      {tenantChartData.map((item, index) => (
                        <Cell
                          key={item.name}
                          fill={[
                            CHART_COLORS.primary,
                            CHART_COLORS.gold,
                            CHART_COLORS.red,
                          ][index]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState loading={loading} />
            )}
          </ChartPanel>

          <ChartPanel
            title="Assinaturas"
            description="Composição da carteira por situação."
            className={styles.chartWide}
            label="Recorrência"
          >
            {subscriptions ? (
              <div className={styles.subscriptionContent}>
                <div className={styles.donutChart}>
                  {subscriptionTotal > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subscriptionChartData.filter((item) => item.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="65%"
                          outerRadius="88%"
                          paddingAngle={3}
                          stroke="none"
                        >
                          {subscriptionChartData
                            .filter((item) => item.value > 0)
                            .map((item) => (
                              <Cell key={item.name} fill={item.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className={styles.donutEmpty}>Sem assinaturas</div>
                  )}
                  <div className={styles.donutCenter}>
                    <strong>{subscriptionTotal}</strong>
                    <span>Total</span>
                  </div>
                </div>

                <div className={styles.legendList}>
                  {subscriptionChartData.map((item) => (
                    <div className={styles.legendItem} key={item.name}>
                      <span
                        className={styles.legendDot}
                        style={{ backgroundColor: item.color }}
                      />
                      <span className={styles.legendName}>{item.name}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ChartEmptyState loading={loading} />
            )}
          </ChartPanel>

          <ChartPanel
            title="Financeiro"
            description="Valores recebidos, pendentes e vencidos."
            className={styles.chartWide}
            label="Faturamento"
          >
            {billing ? (
              <>
                <div className={styles.financeHighlights}>
                  <div>
                    <span className={styles.financeLabel}>Recebido</span>
                    <strong className={styles.financeReceived}>
                      {formatMetricCurrency(billing.received.amount)}
                    </strong>
                  </div>
                  <div>
                    <span className={styles.financeLabel}>Pendente</span>
                    <strong className={styles.financePending}>
                      {formatMetricCurrency(billing.pending.amount)}
                    </strong>
                  </div>
                  <div>
                    <span className={styles.financeLabel}>Vencido</span>
                    <strong className={styles.financeOverdue}>
                      {formatMetricCurrency(billing.overdue.amount)}
                    </strong>
                  </div>
                </div>

                <div className={styles.chart}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={billingChartData} barSize={54}>
                      <CartesianGrid
                        stroke="#26364d"
                        strokeDasharray="3 5"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={AXIS_TICK}
                        axisLine={{ stroke: "#334155" }}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={formatCurrency}
                        tick={AXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                        width={85}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value) => [
                          formatMetricCurrency(Number(value)),
                          "Valor",
                        ]}
                        cursor={{ fill: "#ffffff08" }}
                      />
                      <Bar dataKey="valor" name="Valor" radius={[7, 7, 0, 0]}>
                        {billingChartData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <ChartEmptyState loading={loading} />
            )}
          </ChartPanel>
        </div>
      </section>

      <section className={styles.actionsSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>Operação</span>
            <h2 className={styles.sectionTitle}>Ações rápidas</h2>
            <p className={styles.sectionDescription}>
              Acesse rapidamente as principais áreas administrativas.
            </p>
          </div>
        </div>
        <AdminQuickActions />
      </section>
    </main>
  );
}
