import { useCallback, useEffect, useRef, useState } from "react";

import { useTenantStore } from "@/modules/tenant/stores";
import { transactionsService } from "@/modules/transactions/services/transactions.service";
import type { PaymentMethodsSummary } from "@/modules/transactions/types/payment-method-summary";

export function useDashboardPaymentMethods() {
  const tenantId = useTenantStore((state) => state.activeTenantId);
  const requestIdRef = useRef(0);

  const [summary, setSummary] = useState<PaymentMethodsSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(tenantId));
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!tenantId) {
      setSummary(null);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const result = await transactionsService.getPaymentMethodsSummary();

      if (
        requestId !== requestIdRef.current ||
        useTenantStore.getState().activeTenantId !== tenantId
      ) return;

      setSummary(result);
    } catch {
      if (
        requestId !== requestIdRef.current ||
        useTenantStore.getState().activeTenantId !== tenantId
      ) return;

      setSummary(null);
      setError(true);
    } finally {
      if (
        requestId === requestIdRef.current &&
        useTenantStore.getState().activeTenantId === tenantId
      ) setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return { summary, loading, error, reload: load };
}
