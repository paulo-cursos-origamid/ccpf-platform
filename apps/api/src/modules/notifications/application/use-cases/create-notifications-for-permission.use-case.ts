import { Injectable, Logger } from '@nestjs/common';

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
 * Publica notificações para usuários que possuem determinada
 * permissão de plataforma.
 *
 * Falhas na publicação não devem invalidar operações já concluídas
 * nos módulos consumidores.
 */
@Injectable()
export class CreateNotificationsForPermissionUseCase {
  private readonly logger = new Logger(
    CreateNotificationsForPermissionUseCase.name,
  );

  constructor(
    private readonly notificationRecipientRepository: NotificationRecipientRepository,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
  ) {}

  async execute(
    input: CreateNotificationsForPermissionInput,
  ): Promise<{ recipients: number }> {
    let userIds: string[];

    try {
      userIds =
        await this.notificationRecipientRepository.findUserIdsByPermission(
          input.permissionCode,
        );
    } catch (error) {
      this.logger.error(
        `Falha ao buscar destinatários da permissão ${input.permissionCode}.`,
        error instanceof Error ? error.stack : undefined,
      );

      return { recipients: 0 };
    }

    const results = await Promise.allSettled(
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

    const failures = results.filter(
      (result) => result.status === 'rejected',
    ).length;

    if (failures > 0) {
      this.logger.error(
        `${failures} de ${userIds.length} notificações falharam ` +
          `para a permissão ${input.permissionCode}.`,
      );
    }

    return {
      recipients: userIds.length,
    };
  }
}
