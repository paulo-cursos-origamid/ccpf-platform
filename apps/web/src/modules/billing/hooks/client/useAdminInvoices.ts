"use client";

import { useCallback, useEffect, useState } from "react";

import { billingService } from "../../services";
import type {
  AdminInvoiceListParams,
  AdminInvoiceListResponse,
} from "../../types";

interface UseAdminInvoicesState {
  data: AdminInvoiceListResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseAdminInvoicesResult extends UseAdminInvoicesState {
  reload: () => void;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Hook responsável por consultar a listagem global de faturas do painel
 * administrativo, mantendo a consulta sincronizada com paginação,
 * busca e filtro de status.
 */
export function useAdminInvoices(
  params: AdminInvoiceListParams = {},
): UseAdminInvoicesResult {
  const page = params.page ?? DEFAULT_PAGE;
  const limit = params.limit ?? DEFAULT_LIMIT;
  const search = params.search?.trim() ?? "";
  const status = params.status;

  const [state, setState] = useState<UseAdminInvoicesState>({
    data: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const data = await billingService.listAdminInvoices({
        page,
        limit,
        search: search || undefined,
        status,
      });

      setState({
        data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as faturas.",
      });
    }
  }, [limit, page, search, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return {
    ...state,
    reload: load,
  };
}
