import { UserEntity } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { Injectable } from '@nestjs/common';
// import { PasswordHasher } from '../../services/password-hasher.service';
import { PasswordHasherContract } from '../../../domain/contracts/password-hasher.contract';

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
  constructor(
    private readonly userRepository: UserRepository,

    private readonly passwordHasher: PasswordHasherContract,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = new UserEntity({
      name: input.name,
      email: input.email,
      password: passwordHash,
    });

    const savedUser = await this.userRepository.create(user);

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
    };
  }
}
