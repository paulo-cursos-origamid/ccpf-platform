/**
 * Contrato de leitura do dashboard administrativo da plataforma.
 *
 * Responsabilidade:
 * - Definir exclusivamente os dados agregados necessários ao dashboard.
 * - Representar o escopo de leitura permitido para cada usuário.
 * - Evitar acoplamento do dashboard aos repositórios dos módulos de domínio.
 *
 * Este contrato representa um read model administrativo, e não uma
 * operação de domínio de User, Tenant, Subscription ou Invoice.
 */

export interface AdminDashboardScope {
  users: boolean;
  tenants: boolean;
  subscriptions: boolean;
  billing: boolean;
}

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
  /** Faturas integralmente quitadas; não representa receita recebida. */
  paid: AdminDashboardBillingMetric;
  /** Pagamentos confirmados, incluindo parcelas pagas de faturas abertas. */
  received: AdminDashboardBillingMetric;
  /** Saldo das parcelas ainda pendentes. */
  pending: AdminDashboardBillingMetric;
  /** Saldo das parcelas vencidas ainda não pagas. */
  overdue: AdminDashboardBillingMetric;
}

export interface AdminDashboardSummary {
  users?: AdminDashboardUsersSummary;
  tenants?: AdminDashboardTenantsSummary;
  subscriptions?: AdminDashboardSubscriptionsSummary;
  billing?: AdminDashboardBillingSummary;
}

export abstract class AdminDashboardRepository {
  abstract getSummary(
    scope: AdminDashboardScope,
  ): Promise<AdminDashboardSummary>;
}
