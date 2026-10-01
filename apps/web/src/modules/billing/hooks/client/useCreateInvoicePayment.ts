"use client";

import { useCallback, useState } from "react";

import { billingService } from "../../services";
import type {
  CreatePaymentInput,
  Payment,
} from "../../types";

/**
 * Encapsula a criação de uma tentativa de pagamento para uma fatura.
 *
 * A autorização da operação permanece no backend, que exige
 * Tenant OWNER para a criação do pagamento.
 */
export function useCreateInvoicePayment() {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = useCallback(
    async (
      invoiceId: string,
      input: CreatePaymentInput,
    ): Promise<Payment | null> => {
      setLoading(true);
      setError(null);

      try {
        const createdPayment =
          await billingService.createInvoicePayment(
            invoiceId,
            input,
          );

        setPayment(createdPayment);

        return createdPayment;
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Não foi possível criar o pagamento.";

        setError(message);

        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearPayment = useCallback(() => {
    setPayment(null);
    setError(null);
  }, []);

  return {
    payment,
    loading,
    error,
    createPayment,
    clearPayment,
  };
}
