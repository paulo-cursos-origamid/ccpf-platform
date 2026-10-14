import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotificationSeverity } from '../../domain/enums/notification-severity.enum';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { NotificationRepository } from '../../domain/repositories/notification.repository';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  deduplicationKey?: string;
}

/**
 * Cria uma notificação para um destinatário específico.
 */
@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(input: CreateNotificationInput): Promise<NotificationEntity> {
    const now = new Date();

    const notification = new NotificationEntity({
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      severity: input.severity,
      title: input.title,
      message: input.message,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      deduplicationKey: input.deduplicationKey,
      readAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return this.notificationRepository.create(notification);
  }
}
