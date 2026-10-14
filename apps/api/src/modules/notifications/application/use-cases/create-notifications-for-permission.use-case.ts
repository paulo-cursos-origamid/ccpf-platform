import { Injectable } from '@nestjs/common';

import {
  CreateNotificationInput,
  CreateNotificationUseCase,
} from './create-notification.use-case';
import { NotificationRecipientRepository } from '../../domain/repositories/notification-recipient.repository';

export interface CreateNotificationsForPermissionInput extends Omit<
  CreateNotificationInput,
  'userId'
> {
  permissionCode: string;
}

/**
 * Publica uma notificação para todos os usuários que possuem
 * determinada permissão de plataforma.
 *
 * Isso evita que eventos administrativos sejam enviados para todos
 * os usuários indistintamente.
 */
@Injectable()
export class CreateNotificationsForPermissionUseCase {
  constructor(
    private readonly notificationRecipientRepository: NotificationRecipientRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    input: CreateNotificationsForPermissionInput,
  ): Promise<{ recipients: number }> {
    const userIds =
      await this.notificationRecipientRepository.findUserIdsByPermission(
        input.permissionCode,
      );

    await Promise.all(
      userIds.map((userId) =>
        this.createNotificationUseCase.execute({
          userId,
          type: input.type,
          severity: input.severity,
          title: input.title,
          message: input.message,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          deduplicationKey: input.deduplicationKey,
        }),
      ),
    );

    return {
      recipients: userIds.length,
    };
  }
}
