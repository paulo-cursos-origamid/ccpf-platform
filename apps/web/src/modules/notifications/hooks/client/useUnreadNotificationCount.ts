"use client";

import { useCallback, useEffect, useState } from "react";

import {
  NOTIFICATIONS_UPDATED_EVENT,
  notificationService,
} from "../../services";

export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setCount(response.count);
      setError(null);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = Promise.resolve().then(() => load());

    function handleNotificationsUpdated() {
      void load();
    }

    window.addEventListener(
      NOTIFICATIONS_UPDATED_EVENT,
      handleNotificationsUpdated,
    );

    return () => {
      void initialLoad;
      window.removeEventListener(
        NOTIFICATIONS_UPDATED_EVENT,
        handleNotificationsUpdated,
      );
    };
  }, [load]);

  return { count, loading, error, reload: load };
}
