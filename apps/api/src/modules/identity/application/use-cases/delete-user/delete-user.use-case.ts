import { Injectable, NotFoundException } from '@nestjs/common';

import { UserRepository } from '../../../domain/repositories/user.repository';
import { CreateNotificationsForPermissionUseCase } from '../../../../notifications/application/use-cases/create-notifications-for-permission.use-case';
import { NotificationSeverity } from '../../../../notifications/domain/enums/notification-severity.enum';
import { NotificationType } from '../../../../notifications/domain/enums/notification-type.enum';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly createNotificationsForPermissionUseCase: CreateNotificationsForPermissionUseCase,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    await this.userRepository.softDelete(id);

    await this.createNotificationsForPermissionUseCase.execute({
      permissionCode: 'USERS_READ',
      type: NotificationType.USER_REMOVED,
      severity: NotificationSeverity.WARNING,
      title: 'Usuário removido',
      message: `O usuário ${user.name} foi removido da plataforma.`,
      resourceType: 'USER',
      resourceId: user.id,
      deduplicationKey: `USER_REMOVED:${user.id}`,
    });
  }
}
