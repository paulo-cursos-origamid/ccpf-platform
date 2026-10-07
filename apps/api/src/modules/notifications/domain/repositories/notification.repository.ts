import { NotificationEntity } from '../entities/notification.entity';
import { NotificationType } from '../enums/notification-type.enum';

export interface ListNotificationsOptions {
  page: number;
  limit: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export interface ListNotificationsResult {
  notifications: NotificationEntity[];
  total: number;
}

/**
 * Contrato de persistência das notificações.
 */
export abstract class NotificationRepository {
  abstract create(
    notification: NotificationEntity,
  ): Promise<NotificationEntity>;

  abstract findManyByUserId(
    userId: string,
    options: ListNotificationsOptions,
  ): Promise<ListNotificationsResult>;

  abstract countUnreadByUserId(userId: string): Promise<number>;

  abstract findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<NotificationEntity | null>;

  abstract save(notification: NotificationEntity): Promise<NotificationEntity>;

  abstract markAllAsRead(userId: string, readAt: Date): Promise<number>;
}
