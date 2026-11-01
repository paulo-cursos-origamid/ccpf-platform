import { NotFoundException } from '@nestjs/common';

import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotificationSeverity } from '../../domain/enums/notification-severity.enum';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { NotificationRepository } from '../../domain/repositories/notification.repository';
import { MarkNotificationAsReadUseCase } from './mark-notification-as-read.use-case';

describe('MarkNotificationAsReadUseCase', () => {
  let useCase: MarkNotificationAsReadUseCase;
  let notificationRepository: {
    findByIdAndUserId: jest.Mock;
    save: jest.Mock;
  };

  const userId = 'user-1';
  const notificationId = 'notification-1';

  const createNotification = () =>
    new NotificationEntity({
      id: notificationId,
      userId,
      type: NotificationType.PAYMENT_PENDING,
      severity: NotificationSeverity.WARNING,
      title: 'Pagamento pendente',
      message: 'Existe um pagamento pendente.',
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    });

  beforeEach(() => {
    notificationRepository = {
      findByIdAndUserId: jest.fn(),
      save: jest.fn().mockImplementation(async (notification) => notification),
    };

    useCase = new MarkNotificationAsReadUseCase(
      notificationRepository as unknown as NotificationRepository,
    );
  });

  it('deve marcar como lida a notificação do usuário autenticado', async () => {
    const notification = createNotification();
    notificationRepository.findByIdAndUserId.mockResolvedValue(notification);

    const result = await useCase.execute(notificationId, userId);

    expect(notificationRepository.findByIdAndUserId).toHaveBeenCalledWith(
      notificationId,
      userId,
    );
    expect(notification.readAt).toBeInstanceOf(Date);
    expect(notificationRepository.save).toHaveBeenCalledWith(
      notification,
      userId,
    );
    expect(result).toBe(notification);
  });

  it('não deve salvar quando a notificação não pertence ao usuário', async () => {
    notificationRepository.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      useCase.execute(notificationId, 'user-2'),
    ).rejects.toThrow(NotFoundException);

    expect(notificationRepository.findByIdAndUserId).toHaveBeenCalledWith(
      notificationId,
      'user-2',
    );
    expect(notificationRepository.save).not.toHaveBeenCalled();
  });
});
