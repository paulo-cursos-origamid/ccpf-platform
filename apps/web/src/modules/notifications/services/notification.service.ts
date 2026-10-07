import { api } from "@/lib/api/client";

import type {
  Notification,
  NotificationUnreadCountResponse,
} from "../types";

interface NotificationListResponse {
  items: Notification[];
}

class NotificationService {
  async list(): Promise<Notification[]> {
    const response = await api.get<NotificationListResponse>(
      "/notifications",
      { tenantAware: false },
    );

    return response.items;
  }

  getUnreadCount() {
    return api.get<NotificationUnreadCountResponse>(
      "/notifications/unread-count",
      { tenantAware: false },
    );
  }

  markAsRead(notificationId: string) {
    return api.patch<Notification>(
      `/notifications/${notificationId}/read`,
      undefined,
      { tenantAware: false },
    );
  }

  markAllAsRead() {
    return api.patch<void>("/notifications/read-all", undefined, {
      tenantAware: false,
    });
  }
}

export const notificationService = new NotificationService();
