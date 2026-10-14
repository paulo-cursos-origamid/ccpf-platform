"use client";

import { useCallback, useEffect, useState } from "react";

import { platformAdminService } from "../services";
import type { AdminDashboardSummary } from "../types";

interface UseAdminDashboardSummaryState {
  data: AdminDashboardSummary | null;
  loading: boolean;
  error: string | null;
}

export interface UseAdminDashboardSummaryResult
  extends UseAdminDashboardSummaryState {
  reload: () => Promise<void>;
}

export function useAdminDashboardSummary(): UseAdminDashboardSummaryResult {
  const [state, setState] =
    useState<UseAdminDashboardSummaryState>({
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
      const data =
        await platformAdminService.getDashboardSummary();

      setState({
        data,
        loading: false,
        error: null,
      });
    } catch {
      setState((current) => ({
        ...current,
        loading: false,
        error:
          "Não foi possível carregar o resumo do dashboard.",
      }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const data =
          await platformAdminService.getDashboardSummary();

        if (cancelled) {
          return;
        }

        setState({
          data,
          loading: false,
          error: null,
        });
      } catch {
        if (cancelled) {
          return;
        }

        setState((current) => ({
          ...current,
          loading: false,
          error:
            "Não foi possível carregar o resumo do dashboard.",
        }));
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...state,
    reload: load,
  };
}
