/**
 * Níveis de severidade disponíveis para uma notificação.
 */
export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  resourceType: string | null;
  resourceId: string | null;
  deduplicationKey: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationUnreadCountResponse {
  count: number;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationListResponse {
  items: Notification[];
  meta: NotificationPagination;
}
