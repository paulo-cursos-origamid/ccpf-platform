"use client";

import { useState } from "react";

import { accountsService } from "../../services/accounts.service";

/**
 * Hook responsável pelas operações de bloqueio e desbloqueio
 * de um membro dentro de uma conta.
 */
export function useAccountMemberAccess() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function blockMember(accountId: string, memberId: string) {
    setLoading(true);
    setError(null);

    try {
      return await accountsService.blockMember(accountId, memberId);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function unblockMember(accountId: string, memberId: string) {
    setLoading(true);
    setError(null);

    try {
      return await accountsService.unblockMember(accountId, memberId);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    blockMember,
    unblockMember,
    loading,
    error,
  };
}
