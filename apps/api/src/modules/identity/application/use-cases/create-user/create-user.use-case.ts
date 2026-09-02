import { randomUUID } from 'node:crypto';

import { Injectable, ConflictException, Inject } from '@nestjs/common';

import { UserEntity } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { PasswordHasherContract } from '../../../domain/contracts/password-hasher.contract';
import { Prisma } from '@prisma/client';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserOutput {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,

    @Inject(PasswordHasherContract)
    private readonly passwordHasher: PasswordHasherContract,
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

      emailVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
    });

    // const savedUser = await this.userRepository.create(user);
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

    /**
     * Aqui, futuramente, enviaremos um e-mail contendo:
     *
     * https://app.ccpf.com.br/verify?token=verificationToken
     */

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
    };
  }
}
