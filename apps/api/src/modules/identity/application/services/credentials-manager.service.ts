import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserRepository } from '../../domain/repositories/user.repository';

import { PasswordHasherContract } from '../../domain/contracts/password-hasher.contract';

import {
  ChangePasswordInput,
  CredentialsManagerContract,
} from '../../domain/contracts/credentials-manager.contract';

@Injectable()
export class CredentialsManagerService implements CredentialsManagerContract {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherContract,
  ) {}

  async changePassword(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);

    user.changePassword(passwordHash);

    await this.userRepository.update(user);
  }
}
