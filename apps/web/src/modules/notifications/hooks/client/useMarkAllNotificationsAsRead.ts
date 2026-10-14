"use client";

import { useState } from "react";

import { notificationService } from "../../services";

/**
 * Hook responsável por marcar todas as notificações como lidas.
 */
export function useMarkAllNotificationsAsRead() {
  const [loading, setLoading] = useState(false);

  async function markAllAsRead() {
    setLoading(true);

    try {
      await notificationService.markAllAsRead();
    } finally {
      setLoading(false);
    }
  }

  return {
    markAllAsRead,
    loading,
  };
}
