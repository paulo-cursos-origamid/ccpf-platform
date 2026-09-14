"use client";

import { useCallback, useEffect, useState } from "react";

import { accountsService } from "../../services/accounts.service";

import type { AccountMember } from "../../types";

export function useAccountMembers(accountId: string) {
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await accountsService.listMembers(accountId);

      setMembers(response);
      return response;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    let cancelled = false;

    async function fetchMembers() {
      try {
        const response = await accountsService.listMembers(accountId);

        if (cancelled) {
          return;
        }

        setMembers(response);
        setLoading(false);
        setError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setMembers([]);
        setLoading(false);
        setError(error);
      }
    }

    void fetchMembers();

    return () => {
      cancelled = true;
    };
  }, [accountId]);

  return {
    members,
    loading,
    error,
    loadMembers,
  };
}
