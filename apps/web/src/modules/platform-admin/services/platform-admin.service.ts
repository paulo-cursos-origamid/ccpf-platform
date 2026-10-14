/**
 * Serviço de leitura das operações administrativas da plataforma.
 *
 * Responsabilidade:
 * - Centralizar chamadas da API específicas do Platform Admin.
 * - Garantir que endpoints globais não recebam X-Tenant-Id.
 */

import { api } from "@/lib/api/client";

import type { AdminDashboardSummary } from "../types";

export const platformAdminService = {
  /**
   * Obtém o resumo agregado do dashboard administrativo.
   *
   * Este endpoint é global e não depende do Tenant ativo.
   */
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    return api.get<AdminDashboardSummary>(
      "/platform-admin/dashboard/summary",
      {
        tenantAware: false,
      },
    );
  },
};
