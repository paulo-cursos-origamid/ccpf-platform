import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotificationSeverity } from '../../domain/enums/notification-severity.enum';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import {
  ListNotificationsOptions,
  ListNotificationsResult,
  NotificationRepository,
} from '../../domain/repositories/notification.repository';
import { NotificationRecipientRepository } from '../../domain/repositories/notification-recipient.repository';

type PrismaNotification = Prisma.NotificationGetPayload<Record<string, never>>;

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(notification: NotificationEntity): Promise<NotificationEntity> {
    const data = this.toCreateInput(notification);

    const record = notification.deduplicationKey
      ? await this.prisma.notification.upsert({
          where: {
            userId_deduplicationKey: {
              userId: notification.userId,
              deduplicationKey: notification.deduplicationKey,
            },
          },
          update: {},
          create: data,
        })
      : await this.prisma.notification.create({
          data,
        });

    return this.toDomain(record);
  }

  async findManyByUserId(
    userId: string,
    options: ListNotificationsOptions,
  ): Promise<ListNotificationsResult> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(options.unreadOnly ? { readAt: null } : {}),
      ...(options.type
        ? {
            type: options.type,
          }
        : {}),
    };

    const skip = (options.page - 1) * options.limit;

    const [records, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: options.limit,
      }),
      this.prisma.notification.count({
        where,
      }),
    ]);

    return {
      notifications: records.map((record) => this.toDomain(record)),
      total,
    };
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<NotificationEntity | null> {
    const record = await this.prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    return record ? this.toDomain(record) : null;
  }

  async save(notification: NotificationEntity): Promise<NotificationEntity> {
    const record = await this.prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        readAt: notification.readAt,
        updatedAt: notification.updatedAt,
      },
    });

    return this.toDomain(record);
  }

  async markAllAsRead(userId: string, readAt: Date): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt,
        updatedAt: readAt,
      },
    });

    return result.count;
  }

  private toCreateInput(
    notification: NotificationEntity,
  ): Prisma.NotificationUncheckedCreateInput {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      severity: notification.severity,
      title: notification.title,
      message: notification.message,
      resourceType: notification.resourceType,
      resourceId: notification.resourceId,
      deduplicationKey: notification.deduplicationKey,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  private toDomain(record: PrismaNotification): NotificationEntity {
    return new NotificationEntity({
      id: record.id,
      userId: record.userId,
      type: record.type as NotificationType,
      severity: record.severity as NotificationSeverity,
      title: record.title,
      message: record.message,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      deduplicationKey: record.deduplicationKey,
      readAt: record.readAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}

/**
 * Resolve destinatários administrativos diretamente pela estrutura
 * de autorização da plataforma.
 *
 * A consulta considera:
 * - usuário ativo;
 * - usuário não removido;
 * - role de plataforma ativa;
 * - role possuindo a permissão solicitada.
 */
@Injectable()
export class PrismaNotificationRecipientRepository implements NotificationRecipientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserIdsByPermission(permissionCode: string): Promise<string[]> {
    const rows = await this.prisma.userPlatformRole.findMany({
      where: {
        user: {
          isActive: true,
          deletedAt: null,
        },
        role: {
          isActive: true,
          permissions: {
            some: {
              permission: {
                code: permissionCode,
              },
            },
          },
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return rows.map((row) => row.userId);
  }
}
