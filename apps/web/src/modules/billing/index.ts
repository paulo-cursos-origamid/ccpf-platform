/**
 * API pública do módulo Billing.
 *
 * Centraliza os exports que podem ser consumidos por outros módulos
 * do frontend, evitando dependências diretas da estrutura interna.
 */

export { billingService } from "./services";

export type {
  BillingInterval,
  PlanFeatureCode,
  PublicPlan,
} from "./types";
