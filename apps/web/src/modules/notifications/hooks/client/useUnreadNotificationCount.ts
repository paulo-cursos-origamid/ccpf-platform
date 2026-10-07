"use client";

import { useCallback, useEffect, useState } from "react";

import { notificationService } from "../../services";

interface UseUnreadNotificationCountResult {
  count: number;
  loading: boolean;
  error: unknown;
  reload: () => Promise<void>;
}

/**
 * Hook responsável por consultar a quantidade de notificações não lidas.
 *
 * O Header utilizará este hook para manter o badge do sino sincronizado
 * com o estado persistido no backend.
 */
export function useUnreadNotificationCount(): UseUnreadNotificationCountResult {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await notificationService.getUnreadCount();

      setCount(response.count);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchUnreadCount() {
      try {
        const response = await notificationService.getUnreadCount();

        if (cancelled) {
          return;
        }

        setCount(response.count);
        setError(null);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setError(requestError);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchUnreadCount();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    count,
    loading,
    error,
    reload: load,
  };
}
