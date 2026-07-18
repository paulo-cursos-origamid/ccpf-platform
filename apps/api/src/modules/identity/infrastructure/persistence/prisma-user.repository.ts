import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { UserEntity, UserRole } from '../../domain/entities/user.entity';

import { UserRole as PrismaUserRole } from '@prisma/client';

import { UserRepository } from '../../domain/repositories/user.repository';

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
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return new UserEntity({
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      password: rawUser.password,
      role: rawUser.role as UserRole,
      createdAt: rawUser.createdAt,
      updatedAt: rawUser.updatedAt,
    });
  }
}
