import { randomUUID } from 'node:crypto';

import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { EmailVerificationNotifierContract } from '../../../domain/contracts/email-verification-notifier.contract';
import { PasswordHasherContract } from '../../../domain/contracts/password-hasher.contract';
import { UserEntity, UserRole } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface CreateUserOutput {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(PasswordHasherContract)
    private readonly passwordHasher: PasswordHasherContract,
    @Inject(EmailVerificationNotifierContract)
    private readonly emailVerificationNotifier: EmailVerificationNotifierContract,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const verificationToken = randomUUID();

    const verificationTokenExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24,
    );

    const user = new UserEntity({
      name: input.name,
      email: input.email,
      password: passwordHash,
      role: input.role ?? UserRole.USER,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
    });

    let savedUser: UserEntity;

    try {
      savedUser = await this.userRepository.create(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }

      throw error;
    }

    await this.emailVerificationNotifier.sendVerificationEmail({
      email: savedUser.email,
      name: savedUser.name,
      verificationToken,
    });

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
    };
  }
}
