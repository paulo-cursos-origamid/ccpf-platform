"use client";

import { useState } from "react";
import { creditCardsService } from "../../services/credit-cards.service";

export function useArchiveCreditCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function archiveCreditCard(cardId: string) {
    setLoading(true);
    setError(null);
    try {
      return await creditCardsService.archive(cardId);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return { archiveCreditCard, loading, error };
}
