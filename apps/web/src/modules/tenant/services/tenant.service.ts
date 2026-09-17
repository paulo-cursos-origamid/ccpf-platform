import { api } from "@/lib/api/client";

import type { Tenant } from "../types";

// Centraliza as chamadas HTTP relacionadas ao contexto de Tenant.
class TenantService {
  // Obtém os Tenants aos quais o usuário autenticado possui acesso.
  //
  // Este endpoint é usado para descobrir o Tenant ativo e, portanto,
  // não deve enviar o header X-Tenant-Id.
  listMine() {
    return api.get<Tenant[]>("/tenants/me", {
      tenantAware: false,
    });
  }
}

export const tenantService = new TenantService();
