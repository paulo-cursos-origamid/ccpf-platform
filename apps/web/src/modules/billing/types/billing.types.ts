/**
 * Intervalo de cobrança de um plano comercial.
 */
export type BillingInterval = "MONTHLY" | "YEARLY";
/**
 * Dados necessários para solicitar uma nova assinatura.
 *
 * O backend identifica o Tenant através do contexto
 * X-Tenant-Id e recebe somente o código do plano.
 */
export interface CreateSubscriptionInput {
  planCode: string;
}
/**
 * Recursos comerciais disponibilizados por um plano.
 *
 * Esses códigos são definidos pelo domínio Billing do backend.
 */
export type PlanFeatureCode =
  | "DOMESTIC"
  | "HEALTH"
  | "TRANSPORT"
  | "VEHICLES"
  | "INVESTMENTS"
  | "OTHER"
  | "BASIC_REPORTS"
  | "ADVANCED_REPORTS";

/**
 * Status possíveis de uma assinatura.
 *
 * Deve permanecer alinhado ao enum SubscriptionStatus
 * definido no domínio Billing do backend.
 */
export type SubscriptionStatus =
  | "PENDING"
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED";

/**
 * Representação pública de um plano comercial.
 *
 * Corresponde aos dados retornados pelo endpoint:
 * GET /api/v1/billing/plans
 */
export interface PublicPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  maxUsers: number;
  isPublic: boolean;
  isActive: boolean;
  features: PlanFeatureCode[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Representação da assinatura atual de um Tenant.
 *
 * Corresponde ao retorno do endpoint:
 * GET /api/v1/billing/subscription
 *
 * O backend retorna a assinatura sem os dados completos do plano.
 * O planId deve ser utilizado para relacioná-la a um PublicPlan.
 */
export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}
