import { Injectable } from '@nestjs/common';

import { NotificationRepository } from '../../domain/repositories/notification.repository';

/**
 * Marca todas as notificações pendentes do usuário como lidas.
 */
@Injectable()
export class MarkAllNotificationsAsReadUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(userId: string): Promise<{ updated: number }> {
    const updated = await this.notificationRepository.markAllAsRead(
      userId,
      new Date(),
    );

    return { updated };
  }
}
