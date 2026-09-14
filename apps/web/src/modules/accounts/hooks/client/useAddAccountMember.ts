"use client";

import { useState } from "react";

import { accountsService } from "../../services/accounts.service";

import type { AddAccountMemberInput } from "../../services/accounts.service";

export function useAddAccountMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function addAccountMember(
    accountId: string,
    data: AddAccountMemberInput,
  ) {
    setLoading(true);
    setError(null);

    try {
      return await accountsService.addMember(accountId, data);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    addAccountMember,
    loading,
    error,
  };
}
