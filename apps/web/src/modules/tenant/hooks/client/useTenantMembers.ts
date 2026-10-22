"use client";

import { useCallback, useEffect, useState } from "react";

import { useTenantStore } from "../../stores";
import { tenantService } from "../../services/tenant.service";
import type { TenantMember } from "../../types";

export function useTenantMembers() {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadMembers = useCallback(async () => {
    if (!activeTenantId) {
      setMembers([]);
      setError(null);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await tenantService.listMembers();

      // Não aplicar resultados se o Tenant mudou durante a requisição.
      if (useTenantStore.getState().activeTenantId !== activeTenantId) {
        return [];
      }

      setMembers(response);
      return response;
    } catch (caught) {
      if (useTenantStore.getState().activeTenantId === activeTenantId) {
        setError(caught);
      }
      throw caught;
    } finally {
      if (useTenantStore.getState().activeTenantId === activeTenantId) {
        setLoading(false);
      }
    }
  }, [activeTenantId]);

  useEffect(() => {
    let cancelled = false;

    setMembers([]);
    setError(null);
    setLoading(Boolean(activeTenantId));

    if (!activeTenantId) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function fetchMembers() {
      try {
        const response = await tenantService.listMembers();

        if (
          cancelled ||
          useTenantStore.getState().activeTenantId !== activeTenantId
        ) {
          return;
        }

        setMembers(response);
        setError(null);
      } catch (caught) {
        if (
          cancelled ||
          useTenantStore.getState().activeTenantId !== activeTenantId
        ) {
          return;
        }

        setMembers([]);
        setError(caught);
      } finally {
        if (!cancelled) {
          if (useTenantStore.getState().activeTenantId === activeTenantId) {
            setLoading(false);
          }
        }
      }
    }

    void fetchMembers();

    return () => {
      cancelled = true;
    };
  }, [activeTenantId]);

  return { members, loading, error, loadMembers };
}
