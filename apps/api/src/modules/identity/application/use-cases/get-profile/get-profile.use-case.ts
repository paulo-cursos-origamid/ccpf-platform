import { Injectable, NotFoundException } from '@nestjs/common';

import { UserRepository } from '../../../domain/repositories/user.repository';
import { PlatformAuthorizationRepository } from '../../../domain/repositories/platform-authorization.repository';

export interface GetProfileInput {
  userId: string;
}

export interface GetProfileOutput {
  id: string;
  name: string;
  email: string;
  role: string;
  platformPermissions: string[];
}

@Injectable()
export class GetProfileUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly platformAuthorizationRepository: PlatformAuthorizationRepository,
  ) {}

  async execute(input: GetProfileInput): Promise<GetProfileOutput> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const platformPermissions =
      await this.platformAuthorizationRepository.getUserPermissions(user.id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      platformPermissions,
    };
  }
}
