import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import {
  ChangePasswordData,
  ProfileCredentialsContract,
} from '../../domain/contracts/profile-credentials.contract';

import { PasswordHasherContract } from '../../../identity/domain/contracts/password-hasher.contract';

@Injectable()
export class PrismaProfileCredentialsRepository implements ProfileCredentialsContract {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherContract,
  ) {}

  async changePassword(
    userId: string,
    data: ChangePasswordData,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentPasswordMatches = await this.passwordHasher.compare(
      data.currentPassword,
      user.password,
    );

    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await this.passwordHasher.hash(data.newPassword);

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: newPasswordHash,
        refreshTokenHash: null,
      },
    });
  }
}
