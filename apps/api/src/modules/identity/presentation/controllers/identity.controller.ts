import { Body, Controller, Post } from '@nestjs/common';

import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case';

import { CreateUserDto } from '../dto/create-user.dto';

@Controller('identity')
export class IdentityController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post('users')
  async create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }
}
