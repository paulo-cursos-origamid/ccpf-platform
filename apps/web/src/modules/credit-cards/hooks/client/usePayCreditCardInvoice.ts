"use client";

import { useState } from "react";

import { creditCardsService } from "../../services/credit-cards.service";
import type { PayCreditCardInvoiceInput } from "../../types";

export function usePayCreditCardInvoice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function payInvoice(
    invoiceId: string,
    data: PayCreditCardInvoiceInput,
  ) {
    setLoading(true);
    setError(null);

    try {
      return await creditCardsService.payInvoice(invoiceId, data);
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }

  return { payInvoice, loading, error };
}
