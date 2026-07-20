import { Body, Controller, Post } from '@nestjs/common';

import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case';
import { LoginUseCase } from '../../application/use-cases/login/login.use-case';

import { CreateUserDto } from '../dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';

@Controller('identity')
export class IdentityController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('users')
  async create(@Body() dto: CreateUserDto) {
    return this.createUserUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
  }
}
