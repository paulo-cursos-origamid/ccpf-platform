import { BadRequestException, Injectable } from '@nestjs/common';

import { createHash } from 'node:crypto';

import { UserRepository } from '../../../domain/repositories/user.repository';
import { PasswordHasherContract } from '../../../domain/contracts/password-hasher.contract';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherContract,
  ) {}

  async execute(input: ResetPasswordInput) {
    const tokenHash = createHash('sha256').update(input.token).digest('hex');

    const user = await this.userRepository.findByPasswordResetToken(tokenHash);

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);

    user.changePassword(passwordHash);

    await this.userRepository.update(user);

    return {
      message: 'Password reset successfully',
    };
  }
}
