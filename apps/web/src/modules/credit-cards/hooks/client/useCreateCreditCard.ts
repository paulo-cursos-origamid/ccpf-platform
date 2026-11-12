"use client";

import { useState } from "react";
import { creditCardsService } from "../../services/credit-cards.service";
import type { CreateCreditCardInput } from "../../types";

export function useCreateCreditCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function createCreditCard(data: CreateCreditCardInput) {
    setLoading(true);
    setError(null);
    try {
      return await creditCardsService.create(data);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return { createCreditCard, loading, error };
}
