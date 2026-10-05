import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Prisma, UserRole as PrismaUserRole } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { UserEntity, UserRole } from '../../domain/entities/user.entity';

import {
  FindUsersOptions,
  FindUsersResult,
  UserRepository,
} from '../../domain/repositories/user.repository';

/**
 * Persiste usuários e mantém a projeção administrativa
 * UserPlatformRole sincronizada com User.role.
 *
 * User.role é a fonte de verdade do perfil administrativo.
 * UserPlatformRole é a associação utilizada pelo mecanismo
 * de autorização baseado em permissões.
 */
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------
  // CREATE
  // --------------------------------------------------

  async create(user: UserEntity): Promise<UserEntity> {
    const createdUser = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,

          isActive: user.isActive,

          emailVerified: user.emailVerified,

          verificationToken: user.verificationToken,

          verificationTokenExpiresAt: user.verificationTokenExpiresAt,

          refreshTokenHash: user.refreshTokenHash,

          passwordResetToken: user.passwordResetToken,

          passwordResetExpiresAt: user.passwordResetExpiresAt,

          lastLoginAt: user.lastLoginAt,

          deletedAt: user.deletedAt,
        },
      });

      await this.syncPlatformRole(tx, created.id, user.role);

      return created;
    });

    return this.toDomain(createdUser);
  }

  // --------------------------------------------------
  // FIND BY EMAIL
  // --------------------------------------------------

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  // --------------------------------------------------
  // FIND BY ID
  // --------------------------------------------------

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  // --------------------------------------------------
  // FIND BY VERIFICATION TOKEN
  // --------------------------------------------------

  async findByVerificationToken(token: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        deletedAt: null,
      },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  // --------------------------------------------------
  // FIND BY PASSWORD RESET TOKEN
  // --------------------------------------------------

  async findByPasswordResetToken(token: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        deletedAt: null,
      },
    });

    if (!user) {
      return null;
    }

    return this.toDomain(user);
  }

  // --------------------------------------------------
  // FIND MANY
  // --------------------------------------------------

  async findMany(options: FindUsersOptions = {}): Promise<FindUsersResult> {
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);

    const search = options.search?.trim();

    const where = {
      deletedAt: null,

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,

        orderBy: {
          createdAt: 'desc',
        },

        skip: (page - 1) * limit,

        take: limit,
      }),

      this.prisma.user.count({
        where,
      }),
    ]);

    return {
      users: users.map((user) => this.toDomain(user)),
      total,
    };
  }

  // --------------------------------------------------
  // SOFT DELETE
  // --------------------------------------------------

  async softDelete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id,
        },

        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      await tx.userPlatformRole.deleteMany({
        where: {
          userId: id,
        },
      });
    });
  }

  // --------------------------------------------------
  // UPDATE
  // --------------------------------------------------

  async update(user: UserEntity): Promise<UserEntity> {
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: {
          id: user.id,
        },

        data: {
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,

          isActive: user.isActive,

          emailVerified: user.emailVerified,

          verificationToken: user.verificationToken,

          verificationTokenExpiresAt: user.verificationTokenExpiresAt,

          refreshTokenHash: user.refreshTokenHash,

          passwordResetToken: user.passwordResetToken,

          passwordResetExpiresAt: user.passwordResetExpiresAt,

          lastLoginAt: user.lastLoginAt,

          deletedAt: user.deletedAt,
        },
      });

      await this.syncPlatformRole(tx, updated.id, user.role);

      return updated;
    });

    return this.toDomain(updatedUser);
  }

  // --------------------------------------------------
  // PLATFORM ROLE SYNCHRONIZATION
  // --------------------------------------------------

  /**
   * Mantém exatamente uma PlatformRole administrativa
   * correspondente ao UserRole, exceto para USER.
   *
   * A operação é executada dentro da mesma transação que
   * cria/atualiza o usuário.
   */
  private async syncPlatformRole(
    tx: Prisma.TransactionClient,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    await tx.userPlatformRole.deleteMany({
      where: {
        userId,
      },
    });

    const platformRoleCode = this.mapUserRoleToPlatformRole(userRole);

    if (!platformRoleCode) {
      return;
    }

    const platformRole = await tx.platformRole.findUnique({
      where: {
        code: platformRoleCode,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!platformRole || !platformRole.isActive) {
      throw new InternalServerErrorException(
        `PlatformRole "${platformRoleCode}" não encontrada ou está inativa.`,
      );
    }

    await tx.userPlatformRole.create({
      data: {
        userId,
        roleId: platformRole.id,
      },
    });
  }

  /**
   * Traduz o papel legado/administrativo do usuário para
   * a PlatformRole responsável pelas permissões globais.
   */
  private mapUserRoleToPlatformRole(userRole: UserRole): string | null {
    switch (userRole) {
      case UserRole.ADMIN:
        return 'PLATFORM_ADMIN';

      case UserRole.MANAGER:
        return 'PLATFORM_MANAGER';

      case UserRole.SUPPORT:
        return 'PLATFORM_SUPPORT';

      case UserRole.USER:
      default:
        return null;
    }
  }

  // --------------------------------------------------
  // TO DOMAIN
  // --------------------------------------------------

  private toDomain(rawUser: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: PrismaUserRole;

    isActive: boolean;

    emailVerified: boolean;
    verificationToken: string | null;
    verificationTokenExpiresAt: Date | null;

    refreshTokenHash: string | null;

    passwordResetToken: string | null;
    passwordResetExpiresAt: Date | null;

    lastLoginAt: Date | null;

    deletedAt: Date | null;

    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return new UserEntity({
      id: rawUser.id,

      name: rawUser.name,
      email: rawUser.email,
      password: rawUser.password,

      role: rawUser.role as UserRole,

      isActive: rawUser.isActive,

      emailVerified: rawUser.emailVerified,

      verificationToken: rawUser.verificationToken,

      verificationTokenExpiresAt: rawUser.verificationTokenExpiresAt,

      refreshTokenHash: rawUser.refreshTokenHash,

      passwordResetToken: rawUser.passwordResetToken,
      passwordResetExpiresAt: rawUser.passwordResetExpiresAt,

      lastLoginAt: rawUser.lastLoginAt,

      deletedAt: rawUser.deletedAt,

      createdAt: rawUser.createdAt,
      updatedAt: rawUser.updatedAt,
    });
  }
}
