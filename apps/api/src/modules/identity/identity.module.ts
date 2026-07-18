import { Module } from '@nestjs/common';

import { UserRepository } from './domain/repositories/user.repository';

import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';

import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case';
import { IdentityController } from './presentation/controllers/identity.controller';

@Module({
  controllers: [IdentityController],
  providers: [
    CreateUserUseCase,

    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [CreateUserUseCase],
})
export class IdentityModule {}
