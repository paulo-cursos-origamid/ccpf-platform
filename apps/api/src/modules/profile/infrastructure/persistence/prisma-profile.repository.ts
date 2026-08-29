import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import {
  ProfileData,
  ProfileRepository,
  UpdateProfileData,
} from '../../domain/repositories/profile.repository';

@Injectable()
export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<ProfileData | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async update(userId: string, data: UpdateProfileData): Promise<ProfileData> {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.email !== undefined && {
          email: data.email,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
