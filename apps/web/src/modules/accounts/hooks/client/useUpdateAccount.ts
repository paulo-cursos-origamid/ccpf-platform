"use client";

import { useState } from "react";

import {
  accountsService,
  type UpdateAccountInput,
} from "../../services/accounts.service";

/**
 * Hook responsável por atualizar os dados cadastrais de uma conta.
 *
 * Controla os estados de carregamento e erro da operação
 * e delega a comunicação com a API para o AccountsService.
 */
export function useUpdateAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  /**
   * Atualiza o nome e o tipo da conta.
   */
  async function updateAccount(
    accountId: string,
    data: UpdateAccountInput,
  ) {
    setLoading(true);
    setError(null);

    try {
      return await accountsService.update(accountId, data);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    updateAccount,
    loading,
    error,
  };
}
