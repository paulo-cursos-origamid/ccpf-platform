"use client";

import { useState } from "react";
import { creditCardsService } from "../../services/credit-cards.service";
import type { UpdateCreditCardInput } from "../../types";

export function useUpdateCreditCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function updateCreditCard(cardId: string, data: UpdateCreditCardInput) {
    setLoading(true);
    setError(null);
    try {
      return await creditCardsService.update(cardId, data);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return { updateCreditCard, loading, error };
}
