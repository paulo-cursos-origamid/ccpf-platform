import { Injectable } from '@nestjs/common';

import { NotificationRepository } from '../../domain/repositories/notification.repository';

/**
 * Retorna a quantidade de notificações não lidas do usuário autenticado.
 */
@Injectable()
export class CountUnreadNotificationsUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.countUnreadByUserId(userId);

    return { count };
  }
}
