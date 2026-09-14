"use client";

import { useState } from "react";

import {
  accountsService,
  type UpdateAccountMemberRoleInput,
} from "../../services/accounts.service";

/**
 * Hook responsável por alterar a permissão de um membro da conta.
 *
 * Controla os estados de carregamento e erro da operação
 * e delega a comunicação com a API para o AccountsService.
 */
export function useUpdateAccountMemberRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  /**
   * Altera a função/permissão de um membro dentro da conta.
   */
  async function updateMemberRole(
    accountId: string,
    memberId: string,
    data: UpdateAccountMemberRoleInput,
  ) {
    setLoading(true);
    setError(null);

    try {
      return await accountsService.updateMemberRole(accountId, memberId, data);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    updateMemberRole,
    loading,
    error,
  };
}
