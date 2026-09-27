import { api } from "@/lib/api/client";

import type {
  CreateSubscriptionInput,
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
   *
   * O backend pode retornar null quando o Tenant não possui
   * uma assinatura comercial vigente, inclusive após a
   * expiração do período de trial.
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
    return api.post<Subscription>(
      "/billing/subscription",
      input,
    );
  },
};