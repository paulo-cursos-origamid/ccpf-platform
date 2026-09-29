"use client";

import { useCallback, useEffect, useState } from "react";

import { useTenantStore } from "@/modules/tenant/stores";

import { billingService } from "../../services";
import type { Invoice } from "../../types";

export interface InvoiceState {
  invoice: Invoice | null;
  loading: boolean;
  error: unknown;
  reload: () => Promise<void>;
}

/**
 * Hook responsável por carregar uma fatura específica
 * pertencente ao Tenant atualmente selecionado.
 *
 * A troca do Tenant ou do invoiceId dispara automaticamente
 * uma nova carga.
 */
export function useInvoice(invoiceId: string): InvoiceState {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadInvoice = useCallback(
    async (isCancelled?: () => boolean) => {
      /**
       * Sem Tenant ativo não existe contexto para consultar
       * uma fatura tenant-aware.
       */
      if (!activeTenantId || !invoiceId) {
        setInvoice(null);
        setError(null);
        setLoading(false);

        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await billingService.getInvoice(invoiceId);

        if (isCancelled?.()) {
          return;
        }

        setInvoice(result);
      } catch (loadError) {
        if (isCancelled?.()) {
          return;
        }

        setInvoice(null);
        setError(loadError);
      } finally {
        if (!isCancelled?.()) {
          setLoading(false);
        }
      }
    },
    [activeTenantId, invoiceId],
  );

  useEffect(() => {
    let cancelled = false;

    /**
     * Mantemos o mesmo padrão utilizado pelos hooks
     * existentes do módulo Billing.
     */
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      void loadInvoice(() => cancelled);
    });

    return () => {
      cancelled = true;
    };
  }, [loadInvoice]);

  /**
   * Recarrega manualmente os dados da fatura.
   */
  const reload = useCallback(async () => {
    await loadInvoice();
  }, [loadInvoice]);

  return {
    invoice,
    loading,
    error,
    reload,
  };
}
