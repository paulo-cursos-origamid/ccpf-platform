"use client";

import { useCallback, useEffect, useState } from "react";

import { useTenantStore } from "@/modules/tenant/stores";

import { creditCardsService } from "../../services/credit-cards.service";
import type {
  CreditCardInvoice,
  CreditCardInvoicesPagination,
  ListCreditCardInvoicesQuery,
} from "../../types";

const INITIAL_PAGINATION: CreditCardInvoicesPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export function useCreditCardInvoices(
  query: ListCreditCardInvoicesQuery = {},
) {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [pagination, setPagination] =
    useState<CreditCardInvoicesPagination>(INITIAL_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const {
    creditCardId,
    status,
    referenceMonthFrom,
    referenceMonthTo,
    page = 1,
    limit = 10,
  } = query;

  const load = useCallback(async () => {
    if (!activeTenantId) {
      setInvoices([]);
      setPagination(INITIAL_PAGINATION);
      setLoading(false);
      setError(false);
      return [];
    }

    setLoading(true);
    setError(false);

    try {
      const result = await creditCardsService.listInvoices({
        creditCardId,
        status,
        referenceMonthFrom,
        referenceMonthTo,
        page,
        limit,
      });

      console.log("[CreditCardInvoices] Resposta da API:", result);
      console.log("[CreditCardInvoices] Chaves:", Object.keys(result ?? {}));
      setInvoices(result.data);
      setPagination(result.pagination);

      return result.data;
    } catch {
      setInvoices([]);
      setError(true);
      return [];
    } finally {
      setLoading(false);
    }
  }, [
    activeTenantId,
    creditCardId,
    status,
    referenceMonthFrom,
    referenceMonthTo,
    page,
    limit,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    invoices,
    pagination,
    loading,
    error,
    load,
  };
}
