"use client";

import { useCallback, useEffect, useState } from "react";

import { accountsService } from "../../services/accounts.service";

import type { Account } from "../../types";

export function useAccount(id: string) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await accountsService.get(id);

      setAccount(response);

      return response;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAccount() {
      try {
        const response = await accountsService.get(id);

        if (cancelled) {
          return;
        }

        setAccount(response);
        setLoading(false);
        setError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAccount(null);
        setLoading(false);
        setError(error);
      }
    }

    void fetchAccount();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return {
    account,
    loading,
    error,
    loadAccount,
  };
}
