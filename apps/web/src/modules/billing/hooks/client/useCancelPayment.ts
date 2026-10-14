"use client";

import { useCallback, useState } from "react";

import { billingService } from "../../services";

/**
 * Gerencia o cancelamento manual de um pagamento no painel administrativo.
 */
export function useCancelPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = useCallback(
    async (paymentId: string, reason: string): Promise<boolean> => {
      if (!paymentId) {
        setError("Pagamento inválido.");
        return false;
      }

      if (reason.trim().length < 5) {
        setError("Informe um motivo com pelo menos 5 caracteres.");
        return false;
      }

    setLoading(true);
    setError(null);

    try {
      await billingService.cancelPayment(paymentId, reason.trim());
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível cancelar o pagamento.",
      );
      return false;
    } finally {
      setLoading(false);
    }
    },
    [],
  );

  return {
    cancel,
    loading,
    error,
  };
}
