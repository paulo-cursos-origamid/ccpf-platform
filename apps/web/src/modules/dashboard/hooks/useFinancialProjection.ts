import { useEffect, useState } from "react";
import { useTenantStore } from "@/modules/tenant/stores";
import { financialProjectionService } from "../services/financial-projection.service";
import type { FinancialProjection } from "../types/financial-projection.types";

interface ProjectionState {
  tenantId: string | null;
  data: FinancialProjection | null;
  error: string | null;
}

export function useFinancialProjection() {
  const tenantId = useTenantStore((state) => state.activeTenantId);

  const [state, setState] = useState<ProjectionState>({
    tenantId: null,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!tenantId) return;

    let active = true;

    financialProjectionService
      .get()
      .then((result) => {
        if (active) {
          setState({
            tenantId,
            data: result,
            error: null,
          });
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setState({
            tenantId,
            data: null,
            error:
              err instanceof Error
                ? err.message
                : "Erro desconhecido ao carregar a projeção.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [tenantId]);

  const isCurrentTenant = state.tenantId === tenantId;

  return {
    data: isCurrentTenant ? state.data : null,
    error: isCurrentTenant ? state.error : null,
    loading: Boolean(tenantId) && !isCurrentTenant,
  };
}
