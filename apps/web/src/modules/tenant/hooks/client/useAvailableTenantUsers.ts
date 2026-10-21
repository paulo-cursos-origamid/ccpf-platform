"use client";

import { useEffect, useState } from "react";

import { tenantService } from "../../services";
import { useTenantStore } from "../../stores";
import type { AvailableTenantUser } from "../../types";

export function useAvailableTenantUsers(open: boolean) {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const [users, setUsers] = useState<AvailableTenantUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    // Nunca manter na tela usuários disponíveis de outro Tenant.
    setUsers([]);
    setError(null);

    if (!open || !activeTenantId) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function fetchUsers() {
      setLoading(true);

      try {
        const response = await tenantService.listAvailableUsers();

        if (
          cancelled ||
          useTenantStore.getState().activeTenantId !== activeTenantId
        ) {
          return;
        }

        setUsers(response);
      } catch (caught) {
        if (
          cancelled ||
          useTenantStore.getState().activeTenantId !== activeTenantId
        ) {
          return;
        }

        setUsers([]);
        setError(caught);
      } finally {
        if (
          !cancelled &&
          useTenantStore.getState().activeTenantId === activeTenantId
        ) {
          setLoading(false);
        }
      }
    }

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [open, activeTenantId]);

  return { users, loading, error };
}
