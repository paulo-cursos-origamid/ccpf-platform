"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useTenantStore } from "@/modules/tenant/stores";

import { creditCardsService } from "../../services/credit-cards.service";
import type { CreditCardDashboard } from "../../types";

export function useCreditCardDashboard() {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const requestIdRef = useRef(0);

  const [dashboard, setDashboard] =
    useState<CreditCardDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const tenantId = activeTenantId;

    if (!tenantId) {
      setDashboard(null);
      setLoading(false);
      setError(false);
      return null;
    }

    setLoading(true);
    setError(false);

    try {
      const result = await creditCardsService.getDashboard();

      if (
        requestId !== requestIdRef.current ||
        useTenantStore.getState().activeTenantId !== tenantId
      ) {
        return null;
      }

      setDashboard(result);
      return result;
    } catch {
      if (
        requestId !== requestIdRef.current ||
        useTenantStore.getState().activeTenantId !== tenantId
      ) {
        return null;
      }

      setDashboard(null);
      setError(true);
      return null;
    } finally {
      if (
        requestId === requestIdRef.current &&
        useTenantStore.getState().activeTenantId === tenantId
      ) {
        setLoading(false);
      }
    }
  }, [activeTenantId]);

  useEffect(() => {
    void load();

    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return {
    dashboard,
    loading,
    error,
    load,
  };
}
