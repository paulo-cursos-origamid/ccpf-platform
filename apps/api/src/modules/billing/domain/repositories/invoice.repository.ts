import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { SubscriptionStatus } from '../enums/subscription-status.enum';
import { BillingInterval } from '../enums/billing-interval.enum';

export interface FindAdminInvoicesOptions {
  page: number;
  limit: number;
  search?: string;
  status?: InvoiceStatus;
}

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
  startedAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  plan: AdminInvoicePlan;
}

export interface AdminInvoicePayment {
  id: string;
  reference: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt: Date | null;
  expiresAt: Date | null;
  provider: string | null;
  providerPaymentId: string | null;
  externalReference: string | null;
  pixCopyPaste: string | null;
  bankSlipBarcode: string | null;
  bankSlipDigitableLine: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminInvoiceListItem {
  id: string;
  tenantId: string;
  subscriptionId: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  dueAt: Date;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tenant: AdminInvoiceTenant;
  subscription: AdminInvoiceSubscription;
  latestPayment: AdminInvoicePayment | null;
}
export interface AdminInvoiceDetail {
  id: string;
  tenantId: string;
  subscriptionId: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  dueAt: Date;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tenant: AdminInvoiceTenant;
  subscription: AdminInvoiceSubscription;
  payments: AdminInvoicePayment[];
}
export interface FindAdminInvoicesResult {
  invoices: AdminInvoiceListItem[];
  total: number;
}

/**
 * Define o contrato de persistência do domínio Invoice.
 *
 * A implementação concreta pertence à infraestrutura.
 */
export abstract class InvoiceRepository {
  abstract create(invoice: InvoiceEntity): Promise<InvoiceEntity>;

  abstract findById(id: string): Promise<InvoiceEntity | null>;

  abstract findByNumber(number: string): Promise<InvoiceEntity | null>;

  abstract findByTenant(tenantId: string): Promise<InvoiceEntity[]>;

  abstract findBySubscription(subscriptionId: string): Promise<InvoiceEntity[]>;

  abstract update(invoice: InvoiceEntity): Promise<InvoiceEntity>;

  /**
   * Lista globalmente as Invoices para o painel administrativo.
   */
  abstract findManyForAdmin(
    options: FindAdminInvoicesOptions,
  ): Promise<FindAdminInvoicesResult>;

  /**
   * Consulta globalmente uma Invoice para o painel administrativo.
   */
  abstract findAdminById(id: string): Promise<AdminInvoiceDetail | null>;
}
