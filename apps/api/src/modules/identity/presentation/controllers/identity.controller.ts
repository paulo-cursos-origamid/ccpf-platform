import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';

import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case';
import { LoginUseCase } from '../../application/use-cases/login/login.use-case';

import type { Request, Response } from 'express';

import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email/verify-email.use-case';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token/refresh-token.use-case';
import { Req } from '@nestjs/common';

import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { GetProfileUseCase } from '../../application/use-cases/get-profile/get-profile.use-case';
// import type { JwtPayload } from '../../infrastructure/auth/jwt-payload.interface';
import { CurrentUser, type AuthenticatedUser } from '../../infrastructure/auth';
import { LogoutUseCase } from '../../application/use-cases/logout/logout.use-case';

interface RefreshRequest extends Request {
  cookies: {
    refresh_token?: string;
  };
}
@Controller('identity')
export class IdentityController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
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
  async refresh(
    @Req() req: RefreshRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.refreshTokenUseCase.execute({
      refreshToken,
    });

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 15,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return {
      success: true,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.logoutUseCase.execute({
      userId: user.sub,
    });

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return {
      success: true,
    };
  }
}
