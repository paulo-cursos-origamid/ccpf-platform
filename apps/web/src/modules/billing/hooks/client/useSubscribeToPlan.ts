"use client";

import { useState } from "react";

import { billingService } from "../../services";
import type { CreateSubscriptionInput } from "../../types";

/**
 * Controla o estado da operação de criação de uma assinatura.
 *
 * A regra comercial permanece no backend.
 * O hook somente controla loading, erro e execução da operação.
 */
export function useSubscribeToPlan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function subscribeToPlan(
    input: CreateSubscriptionInput,
  ) {
    setLoading(true);
    setError(null);

    try {
      return await billingService.createSubscription(input);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    subscribeToPlan,
    loading,
    error,
  };
}
