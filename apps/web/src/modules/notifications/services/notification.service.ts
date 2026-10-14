import { api } from "@/lib/api/client";

import type {
  Notification,
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from "../types";

const NOTIFICATIONS_UPDATED_EVENT = "ccpf:notifications-updated";

function notifyNotificationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
  }
}

class NotificationService {
  list(page = 1, limit = 50): Promise<NotificationListResponse> {
    return api.get<NotificationListResponse>(
      `/notifications?page=${page}&limit=${limit}`,
      { tenantAware: false },
    );
  }

  getUnreadCount() {
    return api.get<NotificationUnreadCountResponse>(
      "/notifications/unread-count",
      { tenantAware: false },
    );
  }

  async markAsRead(notificationId: string) {
    const result = await api.patch<Notification>(
      `/notifications/${notificationId}/read`,
      undefined,
      { tenantAware: false },
    );
    notifyNotificationsUpdated();
    return result;
  }

  async markAllAsRead() {
    const result = await api.patch<{ updated: number }>(
      "/notifications/read-all",
      undefined,
      { tenantAware: false },
    );
    notifyNotificationsUpdated();
    return result;
  }

  async deleteMany(ids: string[]) {
    const result = await api.delete<{ deleted: number }>(
      "/notifications",
      { tenantAware: false },
      { ids },
    );
    notifyNotificationsUpdated();
    return result;
  }
}

export { NOTIFICATIONS_UPDATED_EVENT };
export const notificationService = new NotificationService();
