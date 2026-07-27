import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from 'src/modules/identity/domain/repositories/user.repository';

export interface GetProfileInput {
  userId: string;
}

export interface GetProfileOutput {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetProfileInput): Promise<GetProfileOutput> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
