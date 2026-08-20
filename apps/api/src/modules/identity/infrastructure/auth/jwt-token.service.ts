import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { TokenProviderContract } from '../../domain/contracts/token-provider.contract';
import { UserRole } from '../../domain/entities/user.entity';

interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
}
@Injectable()
export class JwtTokenService implements TokenProviderContract {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        role,
        type: 'access',
      },
      {
        expiresIn: '15m',
      },
    );
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        type: 'refresh',
      },
      {
        expiresIn: '7d',
      },
    );
  }

  async verifyRefreshToken(token: string): Promise<{ sub: string }> {
    try {
      const payload =
        await this.jwtService.verifyAsync<JwtRefreshPayload>(token);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        sub: payload.sub,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
