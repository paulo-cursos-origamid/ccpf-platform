import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';

import { UserRepository } from '../../../domain/repositories/user.repository';
import { PasswordHasherContract } from '../../../domain/contracts/password-hasher.contract';
import { TokenProviderContract } from '../../../domain/contracts/token-provider.contract';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;

  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,

    @Inject(PasswordHasherContract)
    private readonly passwordHasher: PasswordHasherContract,

    @Inject(TokenProviderContract)
    private readonly tokenProvider: TokenProviderContract,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    user.updateLastLogin();

    await this.userRepository.update(user);

    const accessToken = await this.tokenProvider.generate(user.id, user.email);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
