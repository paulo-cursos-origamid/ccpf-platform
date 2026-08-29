import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';

import { ProfileRepository } from './domain/repositories/profile.repository';
import { ProfileCredentialsContract } from './domain/contracts/profile-credentials.contract';

import { PrismaProfileRepository } from './infrastructure/persistence/prisma-profile.repository';
import { PrismaProfileCredentialsRepository } from './infrastructure/persistence/prisma-profile-credentials.repository';

import { GetMyProfileUseCase } from './application/use-cases/get-my-profile/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from './application/use-cases/update-my-profile/update-my-profile.use-case';
import { ChangeMyPasswordUseCase } from './application/use-cases/change-my-password/change-my-password.use-case';
import { ProfileController } from './presentation/controllers/profile.controller';

@Module({
  imports: [IdentityModule],

  controllers: [ProfileController],

  providers: [
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    ChangeMyPasswordUseCase,

    {
      provide: ProfileRepository,
      useClass: PrismaProfileRepository,
    },

    {
      provide: ProfileCredentialsContract,
      useClass: PrismaProfileCredentialsRepository,
    },
  ],

  exports: [
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    ChangeMyPasswordUseCase,
  ],
})
export class ProfileModule {}
