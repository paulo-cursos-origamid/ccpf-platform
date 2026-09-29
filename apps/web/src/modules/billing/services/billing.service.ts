import { api } from "@/lib/api/client";

import type {
  ConfirmPaymentInput,
  CreatePaymentInput,
  CreateSubscriptionInput,
  Invoice,
  Payment,
  PublicPlan,
  Subscription,
} from "../types/billing.types";

/**
 * Serviço responsável pela comunicação do frontend
 * com os endpoints de Billing.
 *
 * Este serviço não contém regras de apresentação.
 * Sua responsabilidade é somente transportar os dados
 * entre a API e os módulos consumidores.
 */
export const billingService = {
  /**
   * Lista os planos comerciais públicos e ativos.
   *
   * O endpoint é público e, portanto, não deve receber
   * automaticamente o header X-Tenant-Id.
   */
  async listPublicPlans(): Promise<PublicPlan[]> {
    return api.get<PublicPlan[]>("/billing/plans", {
      tenantAware: false,
    });
  },

  /**
   * Obtém a assinatura comercial atual do Tenant ativo.
   *
   * O ApiClient adicionará automaticamente o header
   * X-Tenant-Id porque este endpoint depende do contexto
   * do Tenant.
   */
  async getCurrentSubscription(): Promise<Subscription | null> {
    return api.get<Subscription | null>("/billing/subscription");
  },

  /**
   * Cria uma assinatura para o Tenant ativo.
   *
   * O Tenant é definido pelo contexto X-Tenant-Id.
   * O backend determina o estado inicial da assinatura:
   * - TRIALING para o plano de trial;
   * - PENDING para planos pagos.
   */
  async createSubscription(
    input: CreateSubscriptionInput,
  ): Promise<Subscription> {
    return api.post<Subscription>("/billing/subscription", input);
  },

  /**
   * Altera o plano da assinatura corrente do Tenant.
   *
   * O backend valida:
   * - se o usuário é OWNER;
   * - se a assinatura pode ser alterada;
   * - se o plano destino está disponível;
   * - se a capacidade do novo plano comporta os membros;
   * - regras de downgrade;
   * - conversão de Trial para plano pago.
   *
   * O endpoint depende do Tenant ativo e, portanto,
   * utiliza o comportamento padrão tenantAware do ApiClient.
   */
  async changeSubscriptionPlan(
    planCode: string,
  ): Promise<Subscription> {
    return api.patch<Subscription>("/billing/subscription/plan", {
      planCode,
    });
  },

  /**
   * Lista o histórico de faturas do Tenant ativo.
   *
   * O endpoint depende do contexto do Tenant e, portanto,
   * utiliza o comportamento padrão tenantAware do ApiClient.
   */
  async listInvoices(): Promise<Invoice[]> {
    return api.get<Invoice[]>("/billing/invoices");
  },

  /**
   * Obtém os detalhes de uma fatura específica do Tenant ativo.
   *
   * O endpoint depende do contexto do Tenant e, portanto,
   * utiliza o comportamento padrão tenantAware do ApiClient.
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    return api.get<Invoice>(`/billing/invoices/${invoiceId}`);
  },

  /**
   * Cria uma tentativa de pagamento para uma Invoice.
   *
   * A operação depende do Tenant ativo e o backend exige
   * que o usuário autenticado seja o OWNER do Tenant.
   *
   * O invoiceId é transportado pela URL e os dados específicos
   * do método de pagamento são enviados no body.
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
   * Confirma manualmente um Payment.
   *
   * Esta operação é administrativa e utiliza a permissão
   * global BILLING_MANAGE. O endpoint não depende do Tenant
   * ativo, portanto não deve receber X-Tenant-Id.
   *
   * A confirmação pode quitar a Invoice e ativar a Subscription
   * conforme as regras do backend.
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
