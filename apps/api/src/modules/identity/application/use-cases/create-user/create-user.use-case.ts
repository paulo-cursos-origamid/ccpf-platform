import { UserEntity } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { Injectable } from '@nestjs/common';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserOutput {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const user = new UserEntity({
      name: input.name,
      email: input.email,
      password: input.password,
    });

    const savedUser = await this.userRepository.create(user);

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
    };
  }
}
