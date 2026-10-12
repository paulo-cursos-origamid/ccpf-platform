"use client";

import {
  NotificationAccessGuard,
  NotificationCenter,
} from "@/modules/notifications";

export default function NotificationsPage() {
  return (
    <NotificationAccessGuard>
      <NotificationCenter />
    </NotificationAccessGuard>
  );
}
