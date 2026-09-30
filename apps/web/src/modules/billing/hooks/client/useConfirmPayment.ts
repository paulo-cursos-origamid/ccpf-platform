"use client";

import { useCallback, useState } from "react";

import { billingService } from "../../services";

/**
 * Hook responsável pela confirmação manual de um Payment
 * através da visão administrativa do Billing.
 */
export function useConfirmPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(async (paymentId: string): Promise<boolean> => {
    if (!paymentId) {
      setError("Pagamento inválido.");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await billingService.confirmPayment(paymentId);

      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível confirmar o pagamento.",
      );

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    confirm,
    loading,
    error,
  };
}
