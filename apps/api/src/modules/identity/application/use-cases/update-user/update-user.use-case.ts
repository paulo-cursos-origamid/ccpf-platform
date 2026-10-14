import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRole } from '../../../domain/entities/user.entity';

import { UserRepository } from '../../../domain/repositories/user.repository';
import { CreateNotificationsForPermissionUseCase } from '../../../../notifications/application/use-cases/create-notifications-for-permission.use-case';
import { NotificationSeverity } from '../../../../notifications/domain/enums/notification-severity.enum';
import { NotificationType } from '../../../../notifications/domain/enums/notification-type.enum';

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserOutput {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly createNotificationsForPermissionUseCase: CreateNotificationsForPermissionUseCase,
  ) {}

  async execute(input: UpdateUserInput): Promise<UpdateUserOutput> {
    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wasActive = user.isActive;

    if (input.email !== undefined) {
      const normalizedEmail = input.email.trim().toLowerCase();

      if (normalizedEmail !== user.email.toLowerCase()) {
        const existingUser =
          await this.userRepository.findByEmail(normalizedEmail);

        if (existingUser && existingUser.id !== user.id) {
          throw new ConflictException('Email already registered');
        }

        user.updateEmail(normalizedEmail);
      }
    }

    if (input.name !== undefined) {
      user.updateName(input.name.trim());
    }

    if (input.role !== undefined) {
      user.changeRole(input.role);
    }

    if (input.isActive !== undefined) {
      if (input.isActive) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

    const updatedUser = await this.userRepository.update(user);

    if (wasActive && !updatedUser.isActive) {
      await this.createNotificationsForPermissionUseCase.execute({
        permissionCode: 'USERS_READ',
        type: NotificationType.USER_BLOCKED,
        severity: NotificationSeverity.WARNING,
        title: 'Usuário bloqueado',
        message: `O usuário ${updatedUser.name} foi bloqueado na plataforma.`,
        resourceType: 'USER',
        resourceId: updatedUser.id,
        deduplicationKey: `USER_BLOCKED:${updatedUser.id}:${updatedUser.updatedAt.getTime()}`,
      });
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      emailVerified: updatedUser.emailVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
