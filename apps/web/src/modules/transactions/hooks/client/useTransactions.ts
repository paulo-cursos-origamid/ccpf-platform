"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenantStore } from "@/modules/tenant/stores";
import { transactionsService } from "../../services/transactions.service";
import type { Transaction, TransactionType } from "../../types/transaction";

export function useTransactions(type?: TransactionType) {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadTransactions = useCallback(async () => {
    if (!activeTenantId) {
      setTransactions([]);
      setLoading(false);
      setError(null);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const result = await transactionsService.list(type);
      setTransactions(result);
      return result;
    } catch (err) {
      setTransactions([]);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeTenantId, type]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!activeTenantId) {
        setTransactions([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await transactionsService.list(type);
        if (!cancelled) setTransactions(result);
      } catch (err) {
        if (!cancelled) {
          setTransactions([]);
          setError(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeTenantId, type]);

  return { transactions, loading, error, loadTransactions };
}
