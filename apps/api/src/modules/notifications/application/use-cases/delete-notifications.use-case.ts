import { BadRequestException, Injectable } from '@nestjs/common';

import { NotificationRepository } from '../../domain/repositories/notification.repository';

@Injectable()
export class DeleteNotificationsUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(ids: string[], userId: string) {
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0 || uniqueIds.length > 50) {
      throw new BadRequestException(
        'Selecione entre 1 e 50 notificações para excluir.',
      );
    }

    const deleted = await this.notificationRepository.deleteManyByIdsAndUserId(
      uniqueIds,
      userId,
    );

    return { deleted };
  }
}
