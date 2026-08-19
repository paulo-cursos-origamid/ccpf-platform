import { useEffect, useState } from "react";

import { userService } from "../../services/user.service";

import type { ListUsersQuery, ListUsersResponse } from "../../types/user-list";

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
  const search = query.search;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await userService.list({
          page,
          limit,
          search,
        });

        if (cancelled) {
          return;
        }

        setState({
          data,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          data: null,
          loading: false,
          error,
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [page, limit, search]);

  return {
    data: state.data,
    users: state.data?.users ?? [],
    pagination: state.data?.pagination ?? null,
    loading: state.loading,
    error: state.error,
  };
}
