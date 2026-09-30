import { api } from "@/lib/api/client";

import type {
  AdminInvoiceDetail,
  AdminInvoiceListParams,
  AdminInvoiceListResponse,
  ConfirmPaymentInput,
  CreatePaymentInput,
  CreateSubscriptionInput,
  Invoice,
  Payment,
  PublicPlan,
  Subscription,
} from "../types";

/**
 * Serviço responsável pela comunicação do frontend
 * com os endpoints de Billing.
 *
 * Este serviço não contém regras de apresentação.
 * Sua responsabilidade é transportar dados entre a API
 * e os módulos consumidores.
 */
export const billingService = {
  /**
   * Lista os planos comerciais públicos e ativos.
   *
   * O endpoint é público e não deve receber
   * automaticamente o header X-Tenant-Id.
   */
  async listPublicPlans(): Promise<PublicPlan[]> {
    return api.get<PublicPlan[]>("/billing/plans", {
      tenantAware: false,
    });
  },

  /**
   * Obtém a assinatura comercial atual do Tenant ativo.
   */
  async getCurrentSubscription(): Promise<Subscription | null> {
    return api.get<Subscription | null>("/billing/subscription");
  },

  /**
   * Cria uma assinatura para o Tenant ativo.
   */
  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<Subscription> {
    return api.post<Subscription>("/billing/subscription", input);
  },

  /**
   * Altera o plano da assinatura corrente do Tenant.
   */
  async changeSubscriptionPlan(planCode: string): Promise<Subscription> {
    return api.patch<Subscription>("/billing/subscription/plan", {
      planCode,
    });
  },

  /**
   * Lista o histórico de faturas do Tenant ativo.
   */
  async listInvoices(): Promise<Invoice[]> {
    return api.get<Invoice[]>("/billing/invoices");
  },

  /**
   * Obtém os detalhes de uma fatura do Tenant ativo.
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    return api.get<Invoice>(`/billing/invoices/${invoiceId}`);
  },

  /**
   * Cria uma tentativa de pagamento para uma Invoice.
   */
  async createInvoicePayment(
    invoiceId: string,
    input: CreatePaymentInput,
  ): Promise<Payment> {
    return api.post<Payment>(
      `/billing/invoices/${invoiceId}/payments`,
      input,
    );
  },

  /**
   * Lista globalmente as Invoices da plataforma.
   *
   * Este endpoint administrativo não depende do Tenant ativo.
   */
  async listAdminInvoices(
    params: AdminInvoiceListParams = {},
  ): Promise<AdminInvoiceListResponse> {
    const query = new URLSearchParams();

    if (params.page !== undefined) {
      query.set("page", String(params.page));
    }

    if (params.limit !== undefined) {
      query.set("limit", String(params.limit));
    }

    if (params.search?.trim()) {
      query.set("search", params.search.trim());
    }

    if (params.status) {
      query.set("status", params.status);
    }

    const queryString = query.toString();

    return api.get<AdminInvoiceListResponse>(
      `/billing/admin/invoices${queryString ? `?${queryString}` : ""}`,
      {
        tenantAware: false,
      },
    );
  },

  /**
   * Obtém o detalhe global de uma Invoice administrativa.
   *
   * Este endpoint não depende do Tenant ativo.
   */
  async getAdminInvoice(invoiceId: string): Promise<AdminInvoiceDetail> {
    return api.get<AdminInvoiceDetail>(
      `/billing/admin/invoices/${invoiceId}`,
      {
        tenantAware: false,
      },
    );
  },

  /**
   * Confirma manualmente um Payment.
   *
   * A operação é administrativa e utiliza BILLING_MANAGE.
   */
  async confirmPayment(
    paymentId: string,
    input: ConfirmPaymentInput = {},
  ): Promise<Payment> {
    return api.patch<Payment>(
      `/billing/payments/${paymentId}/confirm`,
      input,
      {
        tenantAware: false,
      },
    );
  },
};
