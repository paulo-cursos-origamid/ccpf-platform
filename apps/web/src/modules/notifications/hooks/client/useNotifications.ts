"use client";

import { useCallback, useEffect, useState } from "react";

import { notificationService } from "../../services";
import type {
  Notification,
  NotificationPagination,
} from "../../types";

interface UseNotificationsResult {
  notifications: Notification[];
  meta: NotificationPagination;
  loading: boolean;
  error: unknown;
  reload: () => Promise<void>;
}

const EMPTY_META: NotificationPagination = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
};

export function useNotifications(page = 1): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<NotificationPagination>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await notificationService.list(page, 50);
      setNotifications(response.items);
      setMeta(response.meta);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    let cancelled = false;

    async function fetchNotifications() {
      setLoading(true);
      setError(null);

      try {
        const response = await notificationService.list(page, 50);

        if (cancelled) return;

        setNotifications(response.items);
        setMeta(response.meta);
      } catch (requestError) {
        if (cancelled) return;
        setError(requestError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, [page]);

  return { notifications, meta, loading, error, reload: load };
}
