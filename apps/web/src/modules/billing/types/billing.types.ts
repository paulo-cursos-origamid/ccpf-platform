/**
 * Intervalos disponíveis para cobrança de planos.
 *
 * O contrato acompanha o domínio comercial da API:
 * - SEMESTERLY: cobrança semestral;
 * - YEARLY: cobrança anual;
 * - LIFETIME: contratação definitiva sem recorrência.
 */
export type BillingInterval =
  | "SEMESTERLY"
  | "YEARLY"
  | "LIFETIME";

/**
 * Estados possíveis de uma assinatura.
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
 * Estados possíveis de uma Invoice.
 */
export type InvoiceStatus =
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

/**
 * Meios de pagamento aceitos pelo Billing.
 *
 * A apresentação pode traduzir:
 * PIX -> Pix
 * BANK_SLIP -> Boleto
 */
export type PaymentMethod = "PIX" | "BANK_SLIP";

/**
 * Estados possíveis de uma tentativa de pagamento.
 */
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";

/**
 * Código de funcionalidades disponibilizadas por um plano.
 */
export type PlanFeatureCode =
  | "DOMESTIC"
  | "HEALTH"
  | "TRANSPORT"
  | "VEHICLES"
  | "INVESTMENTS"
  | "OTHER"
  | "BASIC_REPORTS"
  | "ADVANCED_REPORTS"
  | "BILLING";

/**
 * Representação pública de uma modalidade comercial.
 *
 * O ID é necessário para que o frontend envie exatamente
 * a modalidade escolhida ao criar ou alterar uma assinatura.
 */
export interface PublicPlanPrice {
  id: string;
  interval: BillingInterval;
  amount: number;
  currency: string;
}

/**
 * Representação pública de um plano comercial.
 *
 * Os dados do produto permanecem separados das condições
 * comerciais disponíveis através de prices[].
 */
export interface PublicPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  maxUsers: number;
  active: boolean;
  features: PlanFeatureCode[];
  prices: PublicPlanPrice[];
}

/**
 * Dados necessários para criação de uma assinatura.
 */
export interface CreateSubscriptionInput {
  planCode: string;
  planPriceId: string;
  billingDay?: number;
}

/**
 * Dados necessários para alteração de uma assinatura.
 */
export interface ChangeSubscriptionPlanInput {
  planCode: string;
  planPriceId: string;
  billingDay?: number;
}

/**
 * Dados do plano associado à assinatura atual.
 * Inclui planos internos que não aparecem no catálogo público.
 */
export interface SubscriptionPlanDetails {
  id: string;
  code: string;
  name: string;
  description: string | null;
  maxUsers: number;
  active: boolean;
  features: PlanFeatureCode[];
}

/**
 * Representação da assinatura comercial do Tenant.
 *
 * Datas são mantidas como string porque atravessam a fronteira
 * HTTP entre a API e o frontend.
 */
export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  planPriceId: string | null;
  plan?: SubscriptionPlanDetails | null;
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  billingDay?: number | null;
}

/**
 * Representação de uma parcela individual de uma fatura.
 */
export interface InvoiceInstallment {
  id: string;
  invoiceId: string;
  number: number;
  totalCount: number;
  amount: number;
  currency: string;
  dueAt: string;
  paidAt: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

/**
 * Representação de uma fatura do Tenant.
 *
 * Corresponde aos dados retornados pelos endpoints:
 * GET /api/v1/billing/invoices
 * GET /api/v1/billing/invoices/:invoiceId
 *
 * Datas são mantidas como string porque atravessam a fronteira
 * HTTP entre a API e o frontend.
 */
export interface Invoice {
  id: string;
  tenantId: string;
  subscriptionId: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  dueAt: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  installments?: InvoiceInstallment[];
}

/**
 * Dados enviados para criar uma tentativa de pagamento.
 *
 * O invoiceId é informado pela URL e o installmentId identifica
 * a parcela real que será paga. O backend gera os instrumentos.
 */
export interface CreatePaymentInput {
  installmentId: string;
  method: PaymentMethod;
  expiresAt?: string;
  externalReference?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Dados enviados para confirmação manual de um Payment.
 *
 * paidAt é opcional; quando omitido, o backend utiliza
 * a data/hora atual.
 */
export interface ConfirmPaymentInput {
  paidAt?: string;
}

/**
 * Representação de uma tentativa de pagamento.
 *
 * Corresponde ao PaymentEntity retornado pela API.
 *
 * Datas são mantidas como string porque atravessam a fronteira
 * HTTP entre a API e o frontend.
 */
export interface Payment {
  id: string;
  installmentId: string;
  reference: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt: string | null;
  expiresAt: string | null;
  provider: string | null;
  providerPaymentId: string | null;
  externalReference: string | null;
  pixCopyPaste: string | null;
  bankSlipBarcode: string | null;
  bankSlipDigitableLine: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
