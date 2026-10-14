import { Injectable, NotFoundException } from '@nestjs/common';

import { NotificationRepository } from '../../domain/repositories/notification.repository';

/**
 * Marca somente a notificação pertencente ao usuário autenticado como lida.
 */
@Injectable()
export class MarkNotificationAsReadUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findByIdAndUserId(
      notificationId,
      userId,
    );

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    notification.markAsRead();

    return this.notificationRepository.save(notification);
  }
}
