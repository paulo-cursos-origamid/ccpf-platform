import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { TokenProviderContract } from '../../domain/contracts/token-provider.contract';

@Injectable()
export class JwtTokenService implements TokenProviderContract {
  constructor(private readonly jwtService: JwtService) {}

  async generate(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync({
      sub: userId,
      email,
    });
  }
}
