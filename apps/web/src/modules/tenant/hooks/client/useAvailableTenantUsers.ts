"use client";

import { useEffect, useState } from "react";

import { tenantService } from "../../services";

import type { AvailableTenantUser } from "../../types";

/**
 * Hook responsável por carregar os usuários globais que podem
 * ser adicionados ao Tenant atualmente selecionado.
 *
 * A consulta acontece somente quando o modal é aberto.
 */
export function useAvailableTenantUsers(open: boolean) {
  const [users, setUsers] = useState<AvailableTenantUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function fetchUsers() {
      setLoading(true);
      setError(null);

      try {
        const response = await tenantService.listAvailableUsers();

        if (cancelled) {
          return;
        }

        setUsers(response);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setUsers([]);
        setError(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [open]);

  return {
    users,
    loading,
    error,
  };
}
