/**
 * Tipos específicos do contexto administrativo do Billing.
 *
 * Estes tipos representam a visão global da plataforma.
 * Diferentemente do Billing do Tenant, o Admin Billing
 * não depende do TenantContext.
 */

import type {
  BillingInterval,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
} from "./billing.types";

export interface AdminInvoiceTenant {
  id: string;
  name: string;
  slug: string;
}

export interface AdminInvoicePlan {
  id: string;
  name: string;
  code: string;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
}

export interface AdminInvoiceSubscription {
  id: string;
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: AdminInvoicePlan;
}

export interface AdminInvoicePayment {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface AdminInvoice {
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
  tenant: AdminInvoiceTenant;
  subscription: AdminInvoiceSubscription;
  latestPayment: AdminInvoicePayment | null;
}

export interface AdminInvoiceDetail
  extends Omit<AdminInvoice, "latestPayment"> {
  payments: AdminInvoicePayment[];
}

export interface AdminInvoiceListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
}

export interface AdminInvoicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminInvoiceListResponse {
  invoices: AdminInvoice[];
  pagination: AdminInvoicePagination;
}
