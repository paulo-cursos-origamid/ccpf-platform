import { api } from "@/lib/api/client";

import type { PublicPlan } from "../types/billing.types";

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
};
