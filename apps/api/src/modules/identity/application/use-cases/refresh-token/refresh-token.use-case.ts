import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';

import * as bcrypt from 'bcrypt';

import { UserRepository } from '../../../domain/repositories/user.repository';

import { TokenProviderContract } from '../../../domain/contracts/token-provider.contract';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,

    @Inject(TokenProviderContract)
    private readonly tokenProvider: TokenProviderContract,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const payload = await this.tokenProvider.verifyRefreshToken(
      input.refreshToken,
    );

    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const valid = await bcrypt.compare(
      input.refreshToken,
      user.refreshTokenHash,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.tokenProvider.generateAccessToken(
      user.id,
      user.email,
    );

    const refreshToken = await this.tokenProvider.generateRefreshToken(user.id);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    user.setRefreshToken(refreshTokenHash);

    await this.userRepository.update(user);

    return {
      accessToken,
      refreshToken,
    };
  }
}
