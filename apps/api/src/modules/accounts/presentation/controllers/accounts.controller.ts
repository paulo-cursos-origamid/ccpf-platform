import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CreateAccountUseCase } from '../../application/use-cases/create-account/create-account.use-case';
import { ListAccountsUseCase } from '../../application/use-cases/list-accounts/list-accounts.use-case';
import {
  CurrentUser,
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../../../identity/infrastructure/auth';

import { CreateAccountDto } from '../dto/create-account.dto';
import { GetAccountUseCase } from '../../application/use-cases/get-account/get-account.use-case';

import { AddAccountMemberUseCase } from '../../application/use-cases/add-account-member/add-account-member.use-case';
import { AddAccountMemberDto } from '../dto/add-account-member.dto';
import { ListAccountMembersUseCase } from '../../application/use-cases/list-account-members/list-account-members.use-case';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly addAccountMemberUseCase: AddAccountMemberUseCase,
    private readonly listAccountMembersUseCase: ListAccountMembersUseCase,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.listAccountsUseCase.execute({
      userId: user.sub,
    });
  }
  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
  ) {
    return this.getAccountUseCase.execute({
      userId: user.sub,
      accountId,
    });
  }
  @Get(':id/members')
  async findMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
  ) {
    return this.listAccountMembersUseCase.execute({
      userId: user.sub,
      accountId,
    });
  }
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAccountDto,
  ) {
    return this.createAccountUseCase.execute({
      userId: user.sub,
      name: dto.name,
      type: dto.type,
      currency: dto.currency,
      initialBalance: dto.initialBalance,
    });
  }
  @Post(':id/members')
  async addMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
    @Body() dto: AddAccountMemberDto,
  ) {
    await this.addAccountMemberUseCase.execute({
      userId: user.sub,
      accountId,
      memberUserId: dto.userId,
      role: dto.role,
    });

    return {
      message: 'Account member added successfully',
    };
  }
}
