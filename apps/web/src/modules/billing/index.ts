/**
 * API pública do módulo Billing.
 *
 * Centraliza os exports que podem ser consumidos por outros módulos
 * do frontend, evitando dependências diretas da estrutura interna.
 */

export { billingService } from "./services";

export {
  useInvoice,
  useTenantInvoices,
  useTenantSubscription,
} from "./hooks";

export type { TenantSubscriptionState } from "./hooks";

export {
  InvoiceDetails,
  InvoiceList,
  InvoiceStatusBadge,
  SubscriptionSummary,
} from "./components";

export type {
  BillingInterval,
  Invoice,
  InvoiceStatus,
  PlanFeatureCode,
  PublicPlan,
  Subscription,
  SubscriptionStatus,
} from "./types";
