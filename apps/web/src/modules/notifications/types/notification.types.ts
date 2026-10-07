/**
 * Níveis de severidade disponíveis para uma notificação.
 */
export type NotificationSeverity =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "ERROR";

/**
 * Representa uma notificação retornada pela API.
 *
 * O contrato acompanha o domínio de Notifications do backend,
 * mantendo o frontend independente das entidades internas do servidor.
 */
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

/**
 * Resposta do endpoint de quantidade de notificações não lidas.
 */
export interface NotificationUnreadCountResponse {
  count: number;
}
