/**
 * Intervalo de cobrança de um plano comercial.
 */
export type BillingInterval = "MONTHLY" | "YEARLY";

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