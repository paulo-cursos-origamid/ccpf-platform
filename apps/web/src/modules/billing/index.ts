/**
 * API pública do módulo Billing.
 *
 * Centraliza os exports que podem ser consumidos por outros módulos
 * do frontend, evitando dependências diretas da estrutura interna.
 */

export { billingService } from "./services";

export { useTenantSubscription } from "./hooks";

export type { TenantSubscriptionState } from "./hooks";

export { SubscriptionSummary } from "./components";

export type {
  BillingInterval,
  PlanFeatureCode,
  PublicPlan,
  Subscription,
  SubscriptionStatus,
} from "./types";
