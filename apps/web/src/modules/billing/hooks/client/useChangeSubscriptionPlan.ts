"use client";

import { useState } from "react";

import { billingService } from "../../services";

/**
 * Controla o estado da operação de alteração
 * do plano da assinatura atual.
 *
 * As regras comerciais permanecem no backend.
 * O hook somente controla loading, erro e execução
 * da operação.
 */
export function useChangeSubscriptionPlan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function changeSubscriptionPlan(planCode: string) {
    setLoading(true);
    setError(null);

    try {
      return await billingService.changeSubscriptionPlan(planCode);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    changeSubscriptionPlan,
    loading,
    error,
  };
}
