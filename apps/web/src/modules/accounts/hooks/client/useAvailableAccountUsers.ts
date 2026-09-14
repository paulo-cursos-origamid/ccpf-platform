"use client";

import { useCallback, useEffect, useState } from "react";

import { accountsService } from "../../services/accounts.service";

interface AvailableAccountUser {
  id: string;
  name: string;
  email: string;
}

export function useAvailableAccountUsers(accountId: string, enabled = true) {
  const [users, setUsers] = useState<AvailableAccountUser[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);

  /**
   * Carrega os usuários ativos que ainda não pertencem à conta.
   */
  const loadUsers = useCallback(async () => {
    if (!enabled) {
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const response = await accountsService.listAvailableUsers(accountId);

      setUsers(response);
      return response;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accountId, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function fetchUsers() {
      try {
        const response = await accountsService.listAvailableUsers(accountId);

        if (cancelled) {
          return;
        }

        setUsers(response);
        setLoading(false);
        setError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setUsers([]);
        setLoading(false);
        setError(error);
      }
    }

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [accountId, enabled]);

  return {
    users,
    loading,
    error,
    loadUsers,
  };
}
