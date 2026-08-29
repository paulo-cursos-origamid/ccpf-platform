import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ProfileData,
  ProfileRepository,
} from '../../../domain/repositories/profile.repository';
import { ProfileEmailAlreadyExistsError } from 'src/modules/profile/domain/contracts/profile-errors';

export interface UpdateMyProfileInput {
  userId: string;
  name?: string;
  email?: string;
}

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(input: UpdateMyProfileInput): Promise<ProfileData> {
    const profile = await this.profileRepository.findByUserId(input.userId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const data = {
      ...(input.name !== undefined && {
        name: input.name.trim(),
      }),
      ...(input.email !== undefined && {
        email: input.email.trim().toLowerCase(),
      }),
    };

    if (
      data.email !== undefined &&
      data.email !== profile.email.toLowerCase()
    ) {
      // A verificação de unicidade será garantida pela
      // infraestrutura/repositório através da constraint
      // UNIQUE do User.email.
    }

    if (data.name === undefined && data.email === undefined) {
      return profile;
    }

    try {
      return await this.profileRepository.update(input.userId, data);
    } catch (error) {
      if (error instanceof ProfileEmailAlreadyExistsError) {
        throw new ConflictException('Email already registered');
      }

      throw error;
    }
  }
}
