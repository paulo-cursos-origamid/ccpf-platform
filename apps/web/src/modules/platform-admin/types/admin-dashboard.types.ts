/**
 * Contratos do dashboard administrativo da plataforma.
 *
 * Responsabilidade:
 * - Representar exatamente o read model retornado pelo Platform Admin.
 * - Manter o frontend desacoplado das entidades internas do backend.
 */

export interface AdminDashboardUsersSummary {
  total: number;
  active: number;
  inactive: number;
}

export interface AdminDashboardTenantsSummary {
  total: number;
  active: number;
  suspended: number;
  cancelled: number;
}

export interface AdminDashboardSubscriptionsSummary {
  total: number;
  pending: number;
  trialing: number;
  active: number;
  pastDue: number;
  suspended: number;
  cancelled: number;
  expired: number;
}

export interface AdminDashboardBillingMetric {
  count: number;
  amount: number;
}

export interface AdminDashboardBillingSummary {
  paid: AdminDashboardBillingMetric;
  pending: AdminDashboardBillingMetric;
  overdue: AdminDashboardBillingMetric;
}

export interface AdminDashboardSummary {
  users: AdminDashboardUsersSummary;
  tenants: AdminDashboardTenantsSummary;
  subscriptions: AdminDashboardSubscriptionsSummary;
  billing: AdminDashboardBillingSummary;
}
