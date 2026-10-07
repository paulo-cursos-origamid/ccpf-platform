import { Injectable } from '@nestjs/common';

import { NotificationType } from '../../domain/enums/notification-type.enum';
import { NotificationRepository } from '../../domain/repositories/notification.repository';

export interface ListNotificationsInput {
  userId: string;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

/**
 * Lista as notificações pertencentes exclusivamente ao usuário autenticado.
 */
@Injectable()
export class ListNotificationsUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(input: ListNotificationsInput) {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));

    const result = await this.notificationRepository.findManyByUserId(
      input.userId,
      {
        page,
        limit,
        unreadOnly: input.unreadOnly,
        type: input.type,
      },
    );

    return {
      items: result.notifications,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }
}
