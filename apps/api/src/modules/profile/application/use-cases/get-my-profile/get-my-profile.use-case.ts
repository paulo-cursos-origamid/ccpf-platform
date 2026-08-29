import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from 'src/modules/profile/domain/repositories/profile.repository';

export interface GetMyProfileInput {
  userId: string;
}

export interface GetMyProfileOutput {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class GetMyProfileUseCase {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(input: GetMyProfileInput): Promise<GetMyProfileOutput> {
    const profile = await this.profileRepository.findByUserId(input.userId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
    };
  }
}
