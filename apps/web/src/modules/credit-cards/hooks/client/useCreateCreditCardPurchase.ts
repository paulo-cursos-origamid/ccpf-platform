"use client";

import { useState } from "react";

import { creditCardsService } from "../../services/credit-cards.service";
import type { CreateCreditCardPurchaseInput } from "../../types";

export function useCreateCreditCardPurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function createPurchase(
    cardId: string,
    data: CreateCreditCardPurchaseInput,
  ) {
    setLoading(true);
    setError(null);

    try {
      return await creditCardsService.createPurchase(cardId, data);
    } catch (requestError) {
      setError(requestError);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }

  return { createPurchase, loading, error };
}
