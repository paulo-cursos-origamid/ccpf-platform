"use client";

import { useCallback, useEffect, useState } from "react";

import { useTenantStore } from "@/modules/tenant/stores";

import { billingService } from "../../services";
import type { Invoice } from "../../types";

export interface TenantInvoicesState {
  invoices: Invoice[];
  loading: boolean;
  error: unknown;
  reload: () => Promise<void>;
}

/**
 * Hook responsável por carregar o histórico de faturas
 * do Tenant atualmente selecionado.
 *
 * A troca do Tenant dispara automaticamente uma nova carga.
 * Sem Tenant ativo, nenhuma chamada à API é realizada.
 */
export function useTenantInvoices(): TenantInvoicesState {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadInvoices = useCallback(
    async (isCancelled?: () => boolean) => {
      /**
       * Sem Tenant ativo não existe contexto para consultar
       * o histórico de cobranças.
       */
      if (!activeTenantId) {
        setInvoices([]);
        setError(null);
        setLoading(false);

        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await billingService.listInvoices();

        if (isCancelled?.()) {
          return;
        }

        setInvoices(result);
      } catch (loadError) {
        if (isCancelled?.()) {
          return;
        }

        setInvoices([]);
        setError(loadError);
      } finally {
        if (!isCancelled?.()) {
          setLoading(false);
        }
      }
    },
    [activeTenantId],
  );

  useEffect(() => {
    let cancelled = false;

    /**
     * Mantemos o mesmo padrão utilizado pelo hook de assinatura:
     * a atualização de estado ocorre no próximo microtask.
     */
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      void loadInvoices(() => cancelled);
    });

    return () => {
      cancelled = true;
    };
  }, [loadInvoices]);

  /**
   * Recarrega o histórico manualmente.
   */
  const reload = useCallback(async () => {
    await loadInvoices();
  }, [loadInvoices]);

  return {
    invoices,
    loading,
    error,
    reload,
  };
}
