"use client";

import { useCallback, useEffect, useState } from "react";
import { useTenantStore } from "@/modules/tenant/stores";
import { financialObligationsService } from "../../services/financial-obligations.service";
import type {
  FinancialObligation,
  FinancialObligationPagination,
  FinancialObligationSummary,
  ListFinancialObligationsParams,
} from "../../types";

const INITIAL_PAGINATION: FinancialObligationPagination = {
  page: 1,
  limit: 20,
  totalItems: 0,
  totalPages: 1,
};

const INITIAL_SUMMARY: FinancialObligationSummary = {
  totalCount: 0,
  pendingCount: 0,
  partiallySettledCount: 0,
  settledCount: 0,
  canceledCount: 0,
  totalRemainingAmount: "0.00",
  overdueCount: 0,
  overdueRemainingAmount: "0.00",
};

/** Carrega compromissos paginados e respeita o tenant ativo. */
export function useFinancialObligations(
  query: ListFinancialObligationsParams = {},
) {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const [obligations, setObligations] = useState<FinancialObligation[]>([]);
  const [pagination, setPagination] =
    useState<FinancialObligationPagination>(INITIAL_PAGINATION);
  const [summary, setSummary] =
    useState<FinancialObligationSummary>(INITIAL_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const {
    type,
    status,
    page = 1,
    limit = 20,
    startDate,
    endDate,
  } = query;

  const load = useCallback(async () => {
    if (!activeTenantId) {
      setObligations([]);
      setPagination(INITIAL_PAGINATION);
      setSummary(INITIAL_SUMMARY);
      setLoading(false);
      setError(false);
      return [];
    }

    setLoading(true);
    setError(false);

    try {
      const result = await financialObligationsService.listPaginated({
        type,
        status,
        page,
        limit,
        startDate,
        endDate,
      });

      setObligations(result.data);
      setPagination(result.pagination);
      setSummary(result.summary);

      return result.data;
    } catch {
      setObligations([]);
      setPagination(INITIAL_PAGINATION);
      setSummary(INITIAL_SUMMARY);
      setError(true);
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeTenantId, type, status, page, limit, startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    obligations,
    pagination,
    summary,
    loading,
    error,
    load,
  };
}
