import { NotificationSeverity } from '../enums/notification-severity.enum';
import { NotificationType } from '../enums/notification-type.enum';

export interface NotificationProps {
  id: string;
  userId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  resourceType?: string | null;
  resourceId?: string | null;
  deduplicationKey?: string | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidade de domínio responsável por representar um aviso persistente
 * direcionado a um usuário da plataforma.
 */
export class NotificationEntity {
  public readonly id: string;
  public readonly userId: string;
  public readonly type: NotificationType;
  public readonly severity: NotificationSeverity;
  public readonly title: string;
  public readonly message: string;
  public readonly resourceType: string | null;
  public readonly resourceId: string | null;
  public readonly deduplicationKey: string | null;
  public readAt: Date | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: NotificationProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.type = props.type;
    this.severity = props.severity;
    this.title = props.title;
    this.message = props.message;
    this.resourceType = props.resourceType ?? null;
    this.resourceId = props.resourceId ?? null;
    this.deduplicationKey = props.deduplicationKey ?? null;
    this.readAt = props.readAt ?? null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Marca a notificação como lida.
   *
   * A operação é idempotente: se já estiver lida, apenas preserva
   * o timestamp original.
   */
  markAsRead(readAt: Date = new Date()): void {
    if (this.readAt) {
      return;
    }

    this.readAt = readAt;
    this.updatedAt = readAt;
  }
}
