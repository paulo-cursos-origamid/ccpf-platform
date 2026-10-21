"use client";

import { useCallback, useEffect, useState } from "react";

import { useTenantStore } from "@/modules/tenant/stores";

import { categoriesService } from "../../services/categories.service";
import type { Category, CategoryType } from "../../types";

interface UseCategoriesState {
  categories: Category[];
  loading: boolean;
  error: unknown;
}

export function useCategories(type?: CategoryType) {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    loading: true,
    error: null,
  });

  const loadCategories = useCallback(async () => {
    if (!activeTenantId) {
      setState({ categories: [], loading: false, error: null });
      return [];
    }

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const categories = await categoriesService.list(type);

      setState({
        categories,
        loading: false,
        error: null,
      });

      return categories;
    } catch (error) {
      setState({
        categories: [],
        loading: false,
        error,
      });

      throw error;
    }
  }, [activeTenantId, type]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      if (!activeTenantId) {
        setState({ categories: [], loading: false, error: null });
        return;
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }));

      try {
        const categories = await categoriesService.list(type);

        if (cancelled) return;

        setState({
          categories,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) return;

        setState({
          categories: [],
          loading: false,
          error,
        });
      }
    }

    void fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [activeTenantId, type]);

  return {
    categories: state.categories,
    loading: state.loading,
    error: state.error,
    loadCategories,
  };
}
