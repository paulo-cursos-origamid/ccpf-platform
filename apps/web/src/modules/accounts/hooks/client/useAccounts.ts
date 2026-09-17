"use client";

import { useCallback, useEffect, useState } from "react";

import { useTenantStore } from "@/modules/tenant/stores";

import { accountsService } from "../../services/accounts.service";

import type { Account } from "../../types";

interface UseAccountsState {
  accounts: Account[];
  loading: boolean;
  error: unknown;
}

// Hook responsável por carregar e manter sincronizada a lista de contas
// pertencente ao Tenant atualmente selecionado.
//
// O Tenant não é enviado manualmente pelo hook.
// O ApiClient obtém o activeTenantId diretamente do TenantStore
// e adiciona automaticamente o header X-Tenant-Id.
export function useAccounts() {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const [state, setState] = useState<UseAccountsState>({
    accounts: [],
    loading: true,
    error: null,
  });

  // Recarrega explicitamente as contas do Tenant ativo.
  //
  // Esta função é utilizada, por exemplo, depois que uma nova conta
  // é criada com sucesso.
  const loadAccounts = useCallback(async () => {
    if (!activeTenantId) {
      setState({
        accounts: [],
        loading: false,
        error: null,
      });

      return [];
    }

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
  }, [activeTenantId]);

  // Sempre que o Tenant ativo mudar, as contas são carregadas novamente.
  //
  // Isso garante que a tela nunca continue exibindo contas do Tenant
  // anterior depois que o usuário trocar o contexto no Header.
  useEffect(() => {
    let cancelled = false;

    async function fetchAccounts() {
      if (!activeTenantId) {
        setState({
          accounts: [],
          loading: false,
          error: null,
        });

        return;
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }));

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
  }, [activeTenantId]);

  return {
    accounts: state.accounts,
    loading: state.loading,
    error: state.error,
    loadAccounts,
  };
}
