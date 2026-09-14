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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

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
import { UpdateAccountUseCase } from '../../application/use-cases/update-account/update-account.use-case';

import { AddAccountMemberDto } from '../dto/add-account-member.dto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountMemberRoleDto } from '../dto/update-account-member-role.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';

/**
 * Controller HTTP do bounded context Accounts.
 *
 * Responsável por receber as requisições autenticadas e delegar
 * toda regra de negócio aos respectivos use cases.
 *
 * O Swagger utilizado neste controller serve somente para
 * documentar o contrato HTTP da API. As regras de autenticação
 * e autorização continuam sendo executadas pelos guards e
 * pelos use cases.
 */
@ApiTags('Accounts')
@ApiBearerAuth('access-token')
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
  @ApiOperation({
    summary: 'Listar minhas contas',
    description:
      'Retorna todas as contas às quais o usuário autenticado possui vínculo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de contas retornada com sucesso.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'account-uuid',
          },
          name: {
            type: 'string',
            example: 'Conta Principal',
          },
          role: {
            type: 'string',
            enum: ['OWNER', 'MANAGER', 'MEMBER', 'VIEWER'],
            example: 'OWNER',
          },
          type: {
            type: 'string',
            enum: [
              'CASH',
              'CHECKING',
              'SAVINGS',
              'DIGITAL',
              'INVESTMENT',
              'OTHER',
            ],
            example: 'CHECKING',
          },
          currency: {
            type: 'string',
            example: 'BRL',
          },
          initialBalance: {
            type: 'number',
            example: 1000,
          },
          balance: {
            type: 'number',
            example: 1250.5,
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'ARCHIVED'],
            example: 'ACTIVE',
          },
          archivedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: null,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.listAccountsUseCase.execute({
      userId: user.sub,
    });
  }

  /**
   * Retorna os dados de uma conta específica.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obter uma conta',
    description:
      'Retorna os dados de uma conta na qual o usuário autenticado possui vínculo.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador da conta.',
    example: 'account-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Conta retornada com sucesso.',
    schema: {
      example: {
        id: 'account-uuid',
        name: 'Conta Principal',
        role: 'OWNER',
        type: 'CHECKING',
        currency: 'BRL',
        initialBalance: 1000,
        balance: 1250.5,
        status: 'ACTIVE',
        archivedAt: null,
        createdAt: '2026-09-14T12:00:00.000Z',
        updatedAt: '2026-09-14T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Conta não encontrada.',
  })
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
  @ApiOperation({
    summary: 'Atualizar uma conta',
    description:
      'Atualiza o nome e o tipo de uma conta. A autorização é determinada pelo vínculo do usuário com a conta.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador da conta.',
    example: 'account-uuid',
  })
  @ApiBody({
    type: UpdateAccountDto,
    examples: {
      updateAccount: {
        summary: 'Atualizar conta',
        value: {
          name: 'Conta Corrente Principal',
          type: 'CHECKING',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Conta atualizada com sucesso.',
    schema: {
      example: {
        id: 'account-uuid',
        name: 'Conta Corrente Principal',
        type: 'CHECKING',
        currency: 'BRL',
        initialBalance: 1000,
        balance: 1250.5,
        status: 'ACTIVE',
        archivedAt: null,
        createdAt: '2026-09-14T12:00:00.000Z',
        updatedAt: '2026-09-14T12:10:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados enviados são inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Conta não encontrada ou usuário sem permissão para alterá-la.',
  })
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
  @ApiOperation({
    summary: 'Listar membros da conta',
    description:
      'Retorna todos os usuários vinculados à conta, incluindo papel e status do vínculo.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador da conta.',
    example: 'account-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Membros retornados com sucesso.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'member-uuid',
          },
          userId: {
            type: 'string',
            example: 'user-uuid',
          },
          name: {
            type: 'string',
            example: 'Paulo Silva',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'paulo@example.com',
          },
          role: {
            type: 'string',
            enum: ['OWNER', 'MANAGER', 'MEMBER', 'VIEWER'],
            example: 'OWNER',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'BLOCKED'],
            example: 'ACTIVE',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  @ApiResponse({
    status: 403,
    description: 'O acesso do usuário à conta está bloqueado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Conta não encontrada.',
  })
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
  @ApiOperation({
    summary: 'Listar usuários disponíveis',
    description:
      'Retorna usuários ativos que ainda não possuem vínculo com a conta. A operação é destinada a OWNER e MANAGER.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador da conta.',
    example: 'account-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuários disponíveis retornados com sucesso.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'user-uuid',
          },
          name: {
            type: 'string',
            example: 'Maria Silva',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'maria@example.com',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Conta não encontrada ou usuário sem permissão.',
  })
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
  @ApiOperation({
    summary: 'Criar conta',
    description:
      'Cria uma nova conta financeira e cria automaticamente o usuário autenticado como OWNER.',
  })
  @ApiBody({
    type: CreateAccountDto,
    examples: {
      createChecking: {
        summary: 'Conta corrente',
        value: {
          name: 'Conta Principal',
          type: 'CHECKING',
          currency: 'BRL',
          initialBalance: 1000,
        },
      },
      createSavings: {
        summary: 'Conta poupança',
        value: {
          name: 'Reserva de Emergência',
          type: 'SAVINGS',
          currency: 'BRL',
          initialBalance: 5000,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Conta criada com sucesso.',
    schema: {
      example: {
        id: 'account-uuid',
        name: 'Conta Principal',
        type: 'CHECKING',
        currency: 'BRL',
        initialBalance: 1000,
        balance: 1000,
        status: 'ACTIVE',
        archivedAt: null,
        createdAt: '2026-09-14T12:00:00.000Z',
        updatedAt: '2026-09-14T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
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
  @ApiOperation({
    summary: 'Adicionar membro à conta',
    description:
      'Adiciona um usuário à conta com o papel informado. Somente OWNER e MANAGER podem gerenciar membros.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador da conta.',
    example: 'account-uuid',
  })
  @ApiBody({
    type: AddAccountMemberDto,
    examples: {
      addMember: {
        summary: 'Adicionar membro',
        value: {
          userId: 'user-uuid',
          role: 'MEMBER',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Membro adicionado com sucesso.',
    schema: {
      example: {
        message: 'Account member added successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Usuário autenticado não possui permissão para gerenciar membros.',
  })
  @ApiResponse({
    status: 404,
    description: 'Conta não encontrada.',
  })
  @ApiResponse({
    status: 409,
    description: 'Usuário já é membro da conta.',
  })
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
  @ApiOperation({
    summary: 'Alterar papel de um membro',
    description:
      'Altera o papel de um membro dentro da conta. Somente o OWNER pode realizar esta operação.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador da conta.',
    example: 'account-uuid',
  })
  @ApiParam({
    name: 'memberId',
    description: 'Identificador do vínculo do membro com a conta.',
    example: 'member-uuid',
  })
  @ApiBody({
    type: UpdateAccountMemberRoleDto,
    examples: {
      updateRole: {
        summary: 'Alterar papel',
        value: {
          role: 'MANAGER',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Papel do membro atualizado com sucesso.',
    schema: {
      example: {
        message: 'Account member role updated successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Operação inválida, incluindo tentativa de alterar o próprio papel ou atribuir OWNER.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Somente o OWNER pode alterar permissões.',
  })
  @ApiResponse({
    status: 404,
    description: 'Conta ou membro não encontrado.',
  })
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
  @ApiOperation({
    summary: 'Bloquear membro',
    description:
      'Bloqueia o acesso de um membro à conta. Somente o OWNER pode realizar esta operação.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador da conta.',
    example: 'account-uuid',
  })
  @ApiParam({
    name: 'memberId',
    description: 'Identificador do vínculo do membro com a conta.',
    example: 'member-uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'Membro bloqueado com sucesso.',
    schema: {
      example: {
        message: 'Account member blocked successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'O OWNER não pode bloquear a si próprio.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Somente o OWNER pode bloquear membros.',
  })
  @ApiResponse({
    status: 404,
    description: 'Conta ou membro não encontrado.',
  })
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
  @ApiOperation({
    summary: 'Desbloquear membro',
    description:
      'Desbloqueia o acesso de um membro à conta. Somente o OWNER pode realizar esta operação.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador da conta.',
    example: 'account-uuid',
  })
  @ApiParam({
    name: 'memberId',
    description: 'Identificador do vínculo do membro com a conta.',
    example: 'member-uuid',
  })
  @ApiResponse({
    status: 201,
    description: 'Membro desbloqueado com sucesso.',
    schema: {
      example: {
        message: 'Account member unblocked successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'O OWNER não pode desbloquear a si próprio.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente, inválido ou expirado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Somente o OWNER pode desbloquear membros.',
  })
  @ApiResponse({
    status: 404,
    description: 'Conta ou membro não encontrado.',
  })
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
