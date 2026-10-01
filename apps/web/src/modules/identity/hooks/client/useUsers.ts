import { useCallback, useEffect, useState } from "react";

import { userService } from "../../services/user.service";

import type {
  ListUsersQuery,
  ListUsersResponse,
} from "../../types/user-list";

interface UseUsersState {
  data: ListUsersResponse | null;
  loading: boolean;
  error: unknown;
}

export function useUsers(query: ListUsersQuery = {}) {
  const [state, setState] = useState<UseUsersState>({
    data: null,
    loading: true,
    error: null,
  });

  const page = query.page;
  const limit = query.limit;
  const search = query.search?.trim() ?? "";

  const load = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const data = await userService.list({
        page,
        limit,
        search,
      });

      setState({
        data,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error,
      }));
    }
  }, [page, limit, search]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [load]);

  return {
    data: state.data,
    users: state.data?.users ?? [],
    pagination: state.data?.pagination ?? null,
    loading: state.loading,
    error: state.error,
    reload: load,
  };
}
