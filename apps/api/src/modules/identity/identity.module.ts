import { Module } from '@nestjs/common';

import { UserRepository } from './domain/repositories/user.repository';

import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';

import { CreateUserUseCase } from './application/use-cases/create-user/create-user.use-case';
import { IdentityController } from './presentation/controllers/identity.controller';

import { BcryptPasswordHasherService } from './infrastructure/security/bcrypt-password-hasher.service';
import { PasswordHasherContract } from './domain/contracts/password-hasher.contract';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './infrastructure/auth/jwt-token.service';
import { TokenProviderContract } from './domain/contracts/token-provider.contract';
import { LoginUseCase } from './application/use-cases/login/login.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email/verify-email.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token/refresh-token.use-case';

import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { GetProfileUseCase } from './application/use-cases/get-profile/get-profile.use-case';
import { LogoutUseCase } from './application/use-cases/logout/logout.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users/list-users.use-case';
import { RolesGuard } from './infrastructure/auth';
import { UpdateUserUseCase } from './application/use-cases/update-user/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user/delete-user.use-case';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'ccpf-secret',
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [IdentityController],

  providers: [
    CreateUserUseCase,
    LoginUseCase,
    LogoutUseCase,
    VerifyEmailUseCase,
    RefreshTokenUseCase,
    GetProfileUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,

    JwtStrategy,
    RolesGuard,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: PasswordHasherContract,
      useClass: BcryptPasswordHasherService,
    },
    {
      provide: TokenProviderContract,
      useClass: JwtTokenService,
    },
  ],
  exports: [CreateUserUseCase, LoginUseCase],
})
export class IdentityModule {}
