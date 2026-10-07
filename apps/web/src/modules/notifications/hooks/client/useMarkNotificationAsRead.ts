"use client";

import { useState } from "react";

import { notificationService } from "../../services";

/**
 * Hook responsável por marcar uma notificação individual como lida.
 */
export function useMarkNotificationAsRead() {
  const [loading, setLoading] = useState(false);

  async function markAsRead(notificationId: string) {
    setLoading(true);

    try {
      return await notificationService.markAsRead(notificationId);
    } finally {
      setLoading(false);
    }
  }

  return {
    markAsRead,
    loading,
  };
}
