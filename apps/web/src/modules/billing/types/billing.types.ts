/**
 * Intervalos disponíveis para cobrança de planos.
 */
export type BillingInterval = "MONTHLY" | "YEARLY";

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
 * Representação pública de um plano comercial.
 */
export interface PublicPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  maxUsers: number;
  trialDays: number;
  active: boolean;
  features: PlanFeatureCode[];
}

/**
 * Dados necessários para criação de uma assinatura.
 */
export interface CreateSubscriptionInput {
  planCode: string;
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
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  cancelledAt: string | null;
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
}

/**
 * Dados enviados para criar uma tentativa de pagamento.
 *
 * O invoiceId não faz parte do body porque é informado
 * pela URL do endpoint.
 *
 * O backend valida os dados específicos conforme o método:
 * - PIX exige pixCopyPaste;
 * - BANK_SLIP exige barcode ou linha digitável.
 */
export interface CreatePaymentInput {
  method: PaymentMethod;
  expiresAt?: string;
  externalReference?: string;
  pixCopyPaste?: string;
  bankSlipBarcode?: string;
  bankSlipDigitableLine?: string;
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
  invoiceId: string;
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
