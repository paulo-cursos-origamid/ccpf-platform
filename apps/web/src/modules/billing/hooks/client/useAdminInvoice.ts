"use client";

import { useCallback, useEffect, useState } from "react";

import { billingService } from "../../services";
import type { AdminInvoiceDetail } from "../../types";

/**
 * Estado e operações do detalhe administrativo de uma Invoice.
 */
export interface UseAdminInvoiceState {
  invoice: AdminInvoiceDetail | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Hook responsável por carregar uma Invoice pela visão
 * administrativa global.
 *
 * Não utiliza TenantContext.
 */
export function useAdminInvoice(invoiceId: string): UseAdminInvoiceState {
  const [invoice, setInvoice] = useState<AdminInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(invoiceId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!invoiceId) {
      setInvoice(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await billingService.getAdminInvoice(invoiceId);

      setInvoice(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar a fatura.",
      );
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return {
    invoice,
    loading,
    error,
    reload: load,
  };
}
