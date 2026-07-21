import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { UserEntity, UserRole } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';

import { UserRole as PrismaUserRole } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserEntity): Promise<UserEntity> {
    const createdUser = await this.prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,

        emailVerified: user.emailVerified,
        verificationToken: user.verificationToken,
        verificationTokenExpiresAt: user.verificationTokenExpiresAt,

        refreshTokenHash: user.refreshTokenHash,

        passwordResetToken: user.passwordResetToken,
        passwordResetExpiresAt: user.passwordResetExpiresAt,

        lastLoginAt: user.lastLoginAt,
      },
    });

    return this.toDomain(createdUser);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }
  async findByVerificationToken(token: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  async update(user: UserEntity): Promise<UserEntity> {
    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,

        emailVerified: user.emailVerified,
        verificationToken: user.verificationToken,
        verificationTokenExpiresAt: user.verificationTokenExpiresAt,

        refreshTokenHash: user.refreshTokenHash,

        passwordResetToken: user.passwordResetToken,
        passwordResetExpiresAt: user.passwordResetExpiresAt,

        lastLoginAt: user.lastLoginAt,
      },
    });

    return this.toDomain(updatedUser);
  }

  private toDomain(rawUser: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: PrismaUserRole;

    emailVerified: boolean;
    verificationToken: string | null;
    verificationTokenExpiresAt: Date | null;

    refreshTokenHash: string | null;

    passwordResetToken: string | null;
    passwordResetExpiresAt: Date | null;

    lastLoginAt: Date | null;

    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return new UserEntity({
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      password: rawUser.password,
      role: rawUser.role as UserRole,

      emailVerified: rawUser.emailVerified,
      verificationToken: rawUser.verificationToken ?? undefined,
      verificationTokenExpiresAt:
        rawUser.verificationTokenExpiresAt ?? undefined,

      refreshTokenHash: rawUser.refreshTokenHash ?? undefined,

      passwordResetToken: rawUser.passwordResetToken ?? undefined,
      passwordResetExpiresAt: rawUser.passwordResetExpiresAt ?? undefined,

      lastLoginAt: rawUser.lastLoginAt ?? undefined,

      createdAt: rawUser.createdAt,
      updatedAt: rawUser.updatedAt,
    });
  }
}
