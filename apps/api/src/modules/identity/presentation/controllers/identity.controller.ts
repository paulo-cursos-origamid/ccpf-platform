import { Body, Controller, Post, Res, Get, UseGuards } from '@nestjs/common';

import type { Response } from 'express';

import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case';
import { LoginUseCase } from '../../application/use-cases/login/login.use-case';

import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email/verify-email.use-case';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token/refresh-token.use-case';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { GetProfileUseCase } from '../../application/use-cases/get-profile/get-profile.use-case';
// import type { JwtPayload } from '../../infrastructure/auth/jwt-payload.interface';
import { CurrentUser, type AuthenticatedUser } from '../../infrastructure/auth';

@Controller('identity')
export class IdentityController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
  ) {}

  @Post('users')
  async create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });

    response.cookie('access_token', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    response.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    return {
      user: result.user,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.getProfileUseCase.execute({
      userId: user.sub,
    });
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.verifyEmailUseCase.execute({
      token: dto.token,
    });
  }
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute({
      refreshToken: dto.refreshToken,
    });
  }
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');

    return {
      success: true,
    };
  }
}
