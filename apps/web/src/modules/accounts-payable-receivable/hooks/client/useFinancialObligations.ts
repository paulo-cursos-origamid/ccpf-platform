"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenantStore } from "@/modules/tenant/stores";
import { financialObligationsService } from "../../services/financial-obligations.service";
import type { FinancialObligation } from "../../types";

/** Carrega compromissos e descarta respostas antigas ao trocar de tenant. */
export function useFinancialObligations() {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const [obligations, setObligations] = useState<FinancialObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!activeTenantId) {
      setObligations([]);
      setLoading(false);
      setError(false);
      return [];
    }

    setLoading(true);
    setError(false);
    try {
      const result = await financialObligationsService.list();
      setObligations(result);
      return result;
    } catch {
      setError(true);
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    let active = true;

    async function fetchObligations() {
      if (!activeTenantId) {
        setObligations([]);
        setLoading(false);
        setError(false);
        return;
      }

      setLoading(true);
      setError(false);
      try {
        const result = await financialObligationsService.list();
        if (active) setObligations(result);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchObligations();
    return () => {
      active = false;
    };
  }, [activeTenantId]);

  return { obligations, loading, error, load };
}
