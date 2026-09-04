import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createHash, randomBytes } from 'node:crypto';

import { UserRepository } from '../../../domain/repositories/user.repository';

import { PasswordResetNotifierContract } from 'src/modules/identity/domain/contracts/password-reset-notifier.contract';

export interface ForgotPasswordInput {
  email: string;
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetNotifier: PasswordResetNotifierContract,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: ForgotPasswordInput) {
    const user = await this.userRepository.findByEmail(input.email);

    const message =
      'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.';

    if (!user) {
      return { message };
    }

    const rawToken = randomBytes(32).toString('hex');

    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    user.setPasswordResetToken(tokenHash, expiresAt);

    await this.userRepository.update(user);

    await this.passwordResetNotifier.notify({
      email: user.email,
      token: rawToken,
      resetUrl,
    });

    return {
      message,
    };
  }
}
