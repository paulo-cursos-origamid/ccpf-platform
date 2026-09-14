import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../../../identity/infrastructure/auth';

import { AddAccountMemberUseCase } from '../../application/use-cases/add-account-member/add-account-member.use-case';
import { BlockAccountMemberUseCase } from '../../application/use-cases/block-account-member/block-account-member.use-case';
import { CreateAccountUseCase } from '../../application/use-cases/create-account/create-account.use-case';
import { GetAccountUseCase } from '../../application/use-cases/get-account/get-account.use-case';
import { ListAccountMembersUseCase } from '../../application/use-cases/list-account-members/list-account-members.use-case';
import { ListAccountsUseCase } from '../../application/use-cases/list-accounts/list-accounts.use-case';
import { ListAvailableAccountUsersUseCase } from '../../application/use-cases/list-available-account-users/list-available-account-users.use-case';
import { UnblockAccountMemberUseCase } from '../../application/use-cases/unblock-account-member/unblock-account-member.use-case';
import { UpdateAccountMemberRoleUseCase } from '../../application/use-cases/update-account-member-role/update-account-member-role.use-case';

import { AddAccountMemberDto } from '../dto/add-account-member.dto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountMemberRoleDto } from '../dto/update-account-member-role.dto';
import { UpdateAccountUseCase } from '../../application/use-cases/update-account/update-account.use-case';
import { UpdateAccountDto } from '../dto/update-account.dto';

/**
 * Controller HTTP do bounded context Accounts.
 *
 * Responsável por receber as requisições autenticadas e delegar
 * toda regra de negócio aos respectivos use cases.
 */
@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly addAccountMemberUseCase: AddAccountMemberUseCase,
    private readonly listAccountMembersUseCase: ListAccountMembersUseCase,
    private readonly listAvailableAccountUsersUseCase: ListAvailableAccountUsersUseCase,
    private readonly updateAccountMemberRoleUseCase: UpdateAccountMemberRoleUseCase,
    private readonly blockAccountMemberUseCase: BlockAccountMemberUseCase,
    private readonly unblockAccountMemberUseCase: UnblockAccountMemberUseCase,
  ) {}

  /**
   * Lista as contas às quais o usuário autenticado possui acesso.
   */
  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.listAccountsUseCase.execute({
      userId: user.sub,
    });
  }

  /**
   * Retorna os dados de uma conta específica.
   */
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

  /**
   * Atualiza os dados cadastrais de uma conta.
   *
   * A autorização e as regras de negócio são delegadas
   * ao UpdateAccountUseCase.
   */
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.updateAccountUseCase.execute({
      userId: user.sub,
      accountId,
      name: dto.name,
      type: dto.type,
    });
  }
  /**
   * Lista os membros da conta.
   */
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

  /**
   * Lista usuários que ainda podem ser adicionados à conta.
   */
  @Get(':id/available-users')
  async findAvailableUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
  ) {
    return this.listAvailableAccountUsersUseCase.execute({
      userId: user.sub,
      accountId,
    });
  }

  /**
   * Cria uma nova conta financeira.
   */
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

  /**
   * Adiciona um novo membro à conta.
   */
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

  /**
   * Altera a permissão de um membro.
   */
  @Patch(':id/members/:memberId')
  async updateMemberRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateAccountMemberRoleDto,
  ) {
    await this.updateAccountMemberRoleUseCase.execute({
      userId: user.sub,
      accountId,
      memberId,
      role: dto.role,
    });

    return {
      message: 'Account member role updated successfully',
    };
  }

  /**
   * Bloqueia o acesso de um membro à conta.
   */
  @Post(':id/members/:memberId/block')
  async blockMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.blockAccountMemberUseCase.execute({
      userId: user.sub,
      accountId,
      memberId,
    });

    return {
      message: 'Account member blocked successfully',
    };
  }

  /**
   * Desbloqueia o acesso de um membro à conta.
   */
  @Post(':id/members/:memberId/unblock')
  async unblockMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') accountId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.unblockAccountMemberUseCase.execute({
      userId: user.sub,
      accountId,
      memberId,
    });

    return {
      message: 'Account member unblocked successfully',
    };
  }
}
