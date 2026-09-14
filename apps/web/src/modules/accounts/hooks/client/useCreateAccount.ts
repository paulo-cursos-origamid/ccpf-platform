"use client";

import { useState } from "react";

import { accountsService } from "../../services/accounts.service";

import type { CreateAccountInput } from "../../services/accounts.service";

export function useCreateAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function createAccount(data: CreateAccountInput) {
    setLoading(true);
    setError(null);

    try {
      return await accountsService.create(data);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    createAccount,
    loading,
    error,
  };
}
