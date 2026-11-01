import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotificationSeverity } from '../../domain/enums/notification-severity.enum';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { PrismaNotificationRepository } from './prisma-notification.repository';

describe('PrismaNotificationRepository', () => {
  let repository: PrismaNotificationRepository;
  let prisma: {
    notification: {
      updateMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  const notificationId = 'notification-1';
  const userId = 'user-1';
  const now = new Date('2026-01-01T10:00:00.000Z');

  const createNotification = () =>
    new NotificationEntity({
      id: notificationId,
      userId,
      type: NotificationType.PAYMENT_PENDING,
      severity: NotificationSeverity.WARNING,
      title: 'Pagamento pendente',
      message: 'Existe um pagamento pendente.',
      readAt: now,
      createdAt: now,
      updatedAt: now,
    });

  const record = {
    id: notificationId,
    userId,
    type: NotificationType.PAYMENT_PENDING,
    severity: NotificationSeverity.WARNING,
    title: 'Pagamento pendente',
    message: 'Existe um pagamento pendente.',
    resourceType: null,
    resourceId: null,
    deduplicationKey: null,
    readAt: now,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    prisma = {
      notification: {
        updateMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    repository = new PrismaNotificationRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('deve atualizar e consultar a notificação usando id e userId', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });
    prisma.notification.findFirst.mockResolvedValue(record);

    const result = await repository.save(createNotification(), userId);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        readAt: now,
        updatedAt: now,
      },
    });

    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: {
        id: notificationId,
        userId,
      },
    });

    expect(result.id).toBe(notificationId);
    expect(result.userId).toBe(userId);
    expect(result.readAt).toEqual(now);
  });

  it('deve rejeitar quando o usuário não for proprietário da notificação', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.save(createNotification(), 'user-2'),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: notificationId,
          userId: 'user-2',
        },
      }),
    );
    expect(prisma.notification.findFirst).not.toHaveBeenCalled();
  });

  it('deve rejeitar se a notificação não for encontrada após a atualização', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 1 });
    prisma.notification.findFirst.mockResolvedValue(null);

    await expect(
      repository.save(createNotification(), userId),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: {
        id: notificationId,
        userId,
      },
    });
  });
});
