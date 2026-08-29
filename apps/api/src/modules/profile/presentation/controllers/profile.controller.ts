import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';

import { GetMyProfileUseCase } from '../../application/use-cases/get-my-profile/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from '../../application/use-cases/update-my-profile/update-my-profile.use-case';
import { ChangeMyPasswordUseCase } from '../../application/use-cases/change-my-password/change-my-password.use-case';

import { UpdateMyProfileDto } from '../dto/update-my-profile.dto';
import { ChangeMyPasswordDto } from '../dto/change-my-password.dto';

import {
  CurrentUser,
  type AuthenticatedUser,
  JwtAuthGuard,
} from '../../../identity/infrastructure/auth';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly getMyProfileUseCase: GetMyProfileUseCase,
    private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
    private readonly changeMyPasswordUseCase: ChangeMyPasswordUseCase,
  ) {}

  @Get()
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.getMyProfileUseCase.execute({
      userId: user.sub,
    });
  }

  @Patch()
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.updateMyProfileUseCase.execute({
      userId: user.sub,
      name: dto.name,
      email: dto.email,
    });
  }

  @Patch('password')
  async changeMyPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeMyPasswordDto,
  ) {
    await this.changeMyPasswordUseCase.execute({
      userId: user.sub,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });

    return {
      message: 'Password changed successfully',
    };
  }
}
