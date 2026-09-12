"use client";

import { useCallback, useEffect, useState } from "react";

import { accountsService } from "../../services/accounts.service";

import type { Account } from "../../types";

interface UseAccountsState {
  accounts: Account[];
  loading: boolean;
  error: unknown;
}

export function useAccounts() {
  const [state, setState] = useState<UseAccountsState>({
    accounts: [],
    loading: true,
    error: null,
  });

  const loadAccounts = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const accounts = await accountsService.list();

      setState({
        accounts,
        loading: false,
        error: null,
      });

      return accounts;
    } catch (error) {
      setState({
        accounts: [],
        loading: false,
        error,
      });

      throw error;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAccounts() {
      try {
        const accounts = await accountsService.list();

        if (cancelled) {
          return;
        }

        setState({
          accounts,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          accounts: [],
          loading: false,
          error,
        });
      }
    }

    void fetchAccounts();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    accounts: state.accounts,
    loading: state.loading,
    error: state.error,
    loadAccounts,
  };
}
