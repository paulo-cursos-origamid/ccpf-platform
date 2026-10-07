"use client";

import { useCallback, useEffect, useState } from "react";

import { notificationService } from "../../services";

import type { Notification } from "../../types";

interface UseNotificationsResult {
  notifications: Notification[];
  loading: boolean;
  error: unknown;
  reload: () => Promise<void>;
}

/**
 * Hook responsável por carregar as notificações do usuário autenticado.
 *
 * A consulta é independente do Tenant ativo porque Notifications
 * pertence ao contexto do usuário/plataforma.
 */
export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await notificationService.list();

      setNotifications(response);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchNotifications() {
      try {
        const response = await notificationService.list();

        if (cancelled) {
          return;
        }

        setNotifications(response);
        setError(null);
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setNotifications([]);
        setError(requestError);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    notifications,
    loading,
    error,
    reload: load,
  };
}
