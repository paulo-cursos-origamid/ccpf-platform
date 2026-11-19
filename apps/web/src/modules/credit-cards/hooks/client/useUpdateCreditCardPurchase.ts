"use client";

import { useState } from "react";
import { creditCardsService } from "../../services/credit-cards.service";
import type { UpdateCreditCardPurchaseInput } from "../../types";

export function useUpdateCreditCardPurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function updatePurchase(
    cardId: string,
    purchaseId: string,
    data: UpdateCreditCardPurchaseInput,
  ) {
    setLoading(true);
    setError(null);
    try {
      return await creditCardsService.updatePurchase(cardId, purchaseId, data);
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }

  return { updatePurchase, loading, error };
}
