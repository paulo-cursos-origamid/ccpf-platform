import { Injectable } from '@nestjs/common';

import { UserRepository } from '../../../domain/repositories/user.repository';

export interface LogoutInput {
  userId: string;
}

@Injectable()
export class LogoutUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: LogoutInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      return;
    }

    user.setRefreshToken(null);

    await this.userRepository.update(user);
  }
}
