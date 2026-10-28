import { useEffect, useState } from "react";

import { useTenantStore } from "@/modules/tenant/stores";
import { transactionsService } from "@/modules/transactions/services/transactions.service";
import type { Transaction } from "@/modules/transactions/types/transaction";

/**
 * Carrega as transações financeiras do Espaço ativo.
 *
 * Reinicia os estados quando o Espaço muda.
 * Descarta respostas de requisições anteriores para impedir
 * que informações de outro Espaço sejam apresentadas.
 *
 * @param tenantId - Identificador do Espaço ativo.
 * @returns Transações, estado de carregamento e estado de erro.
 */
export function useDashboardTransactions(tenantId: string | null) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setTransactions([]);
    setTransactionsError(false);
    setTransactionsLoading(Boolean(tenantId));

    if (!tenantId) {
      return () => {
        cancelled = true;
      };
    }

    void transactionsService
      .list()
      .then((items) => {
        if (cancelled || useTenantStore.getState().activeTenantId !== tenantId)
          return;

        setTransactions(items);
      })
      .catch(() => {
        if (cancelled || useTenantStore.getState().activeTenantId !== tenantId)
          return;

        setTransactionsError(true);
      })
      .finally(() => {
        if (cancelled || useTenantStore.getState().activeTenantId !== tenantId)
          return;

        setTransactionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId]);


  return {
    transactions,
    transactionsLoading,
    transactionsError,
  };
}
