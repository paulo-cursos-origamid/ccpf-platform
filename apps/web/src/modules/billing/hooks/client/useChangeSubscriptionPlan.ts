"use client";

import { useState } from "react";

import { billingService } from "../../services";
import type { ChangeSubscriptionPlanInput } from "../../types";

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

  async function changeSubscriptionPlan(
    input: ChangeSubscriptionPlanInput,
  ) {
    setLoading(true);
    setError(null);

    try {
      return await billingService.changeSubscriptionPlan(input);
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
