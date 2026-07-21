import { Injectable, BadRequestException } from '@nestjs/common';

import { UserRepository } from '../../../domain/repositories/user.repository';

export interface VerifyEmailInput {
  token: string;
}

@Injectable()
export class VerifyEmailUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: VerifyEmailInput) {
    const user = await this.userRepository.findByVerificationToken(input.token);

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Verification token expired');
    }

    user.verifyEmail();

    await this.userRepository.update(user);

    return {
      message: 'Email verified successfully',
    };
  }
}
