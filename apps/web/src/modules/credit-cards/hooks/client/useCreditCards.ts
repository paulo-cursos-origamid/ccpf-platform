"use client";

import { useCallback, useEffect, useState } from "react";

import { useTenantStore } from "@/modules/tenant/stores";

import { creditCardsService } from "../../services/credit-cards.service";
import type { CreditCard } from "../../types";

export function useCreditCards() {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!activeTenantId) {
      setCards([]);
      setLoading(false);
      setError(false);
      return [];
    }

    setLoading(true);
    setError(false);

    try {
      const result = await creditCardsService.list();
      setCards(result);
      return result;
    } catch {
      setError(true);
      return [];
    } finally {
      setLoading(false);
    }
  }, [activeTenantId]);

  useEffect(() => {
    let active = true;

    async function fetchCards() {
      if (!activeTenantId) {
        setCards([]);
        setLoading(false);
        setError(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const result = await creditCardsService.list();
        if (active) setCards(result);
      } catch {
        if (active) {
          setCards([]);
          setError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchCards();

    return () => {
      active = false;
    };
  }, [activeTenantId]);

  return { cards, loading, error, load };
}
