"use client";

import { useCallback, useEffect, useState } from "react";

import { financialGoalsService } from "../../services/financial-goals.service";
import type { FinancialGoalListItem } from "../../types";

import { useTenantStore } from "@/modules/tenant/stores";

export function useFinancialGoals() {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const [goals, setGoals] = useState<FinancialGoalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadGoals = useCallback(async () => {
    if (!activeTenantId) {
      setGoals([]);
      setLoading(false);
      setError(false);
      return [];
    }

    setLoading(true);
    setError(false);

    try {
      const result = await financialGoalsService.list();
      setGoals(result);
      return result;
    } catch {
      setError(true);
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!activeTenantId) {
        setGoals([]);
        setLoading(false);
        setError(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const result = await financialGoalsService.list();
        if (!cancelled) setGoals(result);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeTenantId]);

  return { goals, loading, error, loadGoals };
}
