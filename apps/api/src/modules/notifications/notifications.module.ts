import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../../infrastructure/database/prisma.module';

import { CountUnreadNotificationsUseCase } from './application/use-cases/count-unread-notifications.use-case';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { CreateNotificationsForPermissionUseCase } from './application/use-cases/create-notifications-for-permission.use-case';
import { ListNotificationsUseCase } from './application/use-cases/list-notifications.use-case';
import { MarkAllNotificationsAsReadUseCase } from './application/use-cases/mark-all-notifications-as-read.use-case';
import { MarkNotificationAsReadUseCase } from './application/use-cases/mark-notification-as-read.use-case';

import { NotificationRepository } from './domain/repositories/notification.repository';
import { NotificationRecipientRepository } from './domain/repositories/notification-recipient.repository';

import {
  PrismaNotificationRecipientRepository,
  PrismaNotificationRepository,
} from './infrastructure/persistence/prisma-notification.repository';

import { NotificationsController } from './presentation/controllers/notifications.controller';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [NotificationsController],
  providers: [
    CreateNotificationUseCase,
    CreateNotificationsForPermissionUseCase,
    ListNotificationsUseCase,
    CountUnreadNotificationsUseCase,
    MarkNotificationAsReadUseCase,
    MarkAllNotificationsAsReadUseCase,
    {
      provide: NotificationRepository,
      useClass: PrismaNotificationRepository,
    },
    {
      provide: NotificationRecipientRepository,
      useClass: PrismaNotificationRecipientRepository,
    },
  ],
  exports: [CreateNotificationsForPermissionUseCase],
})
export class NotificationsModule {}
