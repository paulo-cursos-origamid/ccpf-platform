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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentUser,
  JwtAuthGuard,
} from '../../../identity/infrastructure/auth';

import type { AuthenticatedUser } from '../../../identity/infrastructure/auth';

import { AddTenantMemberUseCase } from '../../application/use-cases/add-tenant-member/add-tenant-member.use-case';
import { BlockTenantMemberUseCase } from '../../application/use-cases/block-tenant-member/block-tenant-member.use-case';
import { ListMyTenantsUseCase } from '../../application/use-cases/list-my-tenants.use-case';
import { ListTenantMembersUseCase } from '../../application/use-cases/list-tenant-members/list-tenant-members.use-case';
import { UnblockTenantMemberUseCase } from '../../application/use-cases/unblock-tenant-member/unblock-tenant-member.use-case';
import { UpdateTenantMemberRoleUseCase } from '../../application/use-cases/update-tenant-member-role/update-tenant-member-role.use-case';

import type { TenantContext } from '../interfaces/tenant-context.interface';
import { AddTenantMemberDto } from '../dto/add-tenant-member.dto';
import { MyTenantResponseDto } from '../dto/my-tenant-response.dto';
import { TenantMemberResponseDto } from '../dto/tenant-member-response.dto';
import { UpdateTenantMemberRoleDto } from '../dto/update-tenant-member-role.dto';
import { CurrentTenant } from '../decorators/tenant-context.decorator';
import { TenantContextGuard } from '../guards/tenant-context.guard';

/**
 * Controller responsável pelas operações HTTP relacionadas
 * ao contexto de Tenant do usuário autenticado.
 */
@ApiTags('Tenants')
@ApiBearerAuth('access-token')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(
    private readonly listMyTenantsUseCase: ListMyTenantsUseCase,
    private readonly listTenantMembersUseCase: ListTenantMembersUseCase,
    private readonly addTenantMemberUseCase: AddTenantMemberUseCase,
    private readonly updateTenantMemberRoleUseCase: UpdateTenantMemberRoleUseCase,
    private readonly blockTenantMemberUseCase: BlockTenantMemberUseCase,
    private readonly unblockTenantMemberUseCase: UnblockTenantMemberUseCase,
  ) {}

  /**
   * Lista os Tenants aos quais o usuário autenticado possui acesso.
   *
   * Este endpoint não exige X-Tenant-Id porque sua finalidade
   * é justamente permitir que o frontend descubra quais Tenants
   * podem ser selecionados como contexto ativo.
   */
  @Get('me')
  @ApiOperation({
    summary: 'Listar meus Tenants',
    description:
      'Retorna os Tenants ativos aos quais o usuário autenticado possui acesso.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de Tenants disponíveis para o usuário.',
    type: MyTenantResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  async findMyTenants(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyTenantResponseDto[]> {
    return this.listMyTenantsUseCase.execute(user.sub);
  }

  /**
   * Lista os membros do Tenant ativo.
   *
   * Este endpoint exige X-Tenant-Id e valida o vínculo
   * do usuário com o Tenant através do TenantContextGuard.
   */
  @Get('members')
  @UseGuards(TenantContextGuard)
  @ApiOperation({
    summary: 'Listar membros do Tenant',
    description:
      'Retorna todos os membros vinculados ao Tenant ativo. Requer X-Tenant-Id.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de membros do Tenant.',
    type: TenantMemberResponseDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado ou contexto do Tenant inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui acesso ao Tenant.',
  })
  async listTenantMembers(
    @CurrentTenant() tenant: TenantContext,
  ): Promise<TenantMemberResponseDto[]> {
    return this.listTenantMembersUseCase.execute({
      tenantId: tenant.tenantId,
    });
  }

  /**
   * Adiciona um usuário existente da plataforma ao Tenant ativo.
   */
  @Post('members')
  @UseGuards(TenantContextGuard)
  @ApiOperation({
    summary: 'Adicionar membro ao Tenant',
    description:
      'Adiciona um usuário existente da plataforma ao Tenant ativo. Somente OWNER e ADMIN podem executar esta operação.',
  })
  @ApiResponse({
    status: 201,
    description: 'Membro adicionado com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário sem permissão ou usuário alvo inativo.',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário alvo não encontrado.',
  })
  @ApiResponse({
    status: 409,
    description: 'Usuário já pertence ao Tenant.',
  })
  async addTenantMember(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddTenantMemberDto,
  ): Promise<void> {
    await this.addTenantMemberUseCase.execute({
      tenantId: tenant.tenantId,
      userId: user.sub,
      memberUserId: dto.userId,
      role: dto.role,
    });
  }

  /**
   * Altera o papel de um membro do Tenant.
   */
  @Patch('members/:memberId/role')
  @UseGuards(TenantContextGuard)
  @ApiOperation({
    summary: 'Alterar papel de membro',
    description:
      'Altera o papel de um membro dentro do Tenant. Somente OWNER e ADMIN podem executar esta operação.',
  })
  @ApiParam({
    name: 'memberId',
    description: 'ID do usuário que receberá o novo papel.',
  })
  @ApiResponse({
    status: 200,
    description: 'Papel alterado com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário sem permissão ou operação não permitida.',
  })
  @ApiResponse({
    status: 404,
    description: 'Membro não encontrado.',
  })
  async updateTenantMemberRole(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTenantMemberRoleDto,
  ): Promise<void> {
    await this.updateTenantMemberRoleUseCase.execute({
      tenantId: tenant.tenantId,
      userId: user.sub,
      memberId,
      role: dto.role,
    });
  }

  /**
   * Bloqueia o acesso de um membro ao Tenant.
   */
  @Post('members/:memberId/block')
  @UseGuards(TenantContextGuard)
  @ApiOperation({
    summary: 'Bloquear membro do Tenant',
    description:
      'Bloqueia o acesso de um membro ao Tenant. Somente OWNER e ADMIN podem executar esta operação.',
  })
  @ApiParam({
    name: 'memberId',
    description: 'ID do usuário que será bloqueado.',
  })
  @ApiResponse({
    status: 201,
    description: 'Membro bloqueado com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário sem permissão ou operação não permitida.',
  })
  @ApiResponse({
    status: 404,
    description: 'Membro não encontrado.',
  })
  async blockTenantMember(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    await this.blockTenantMemberUseCase.execute({
      tenantId: tenant.tenantId,
      userId: user.sub,
      memberId,
    });
  }

  /**
   * Desbloqueia o acesso de um membro ao Tenant.
   */
  @Post('members/:memberId/unblock')
  @UseGuards(TenantContextGuard)
  @ApiOperation({
    summary: 'Desbloquear membro do Tenant',
    description:
      'Restaura o acesso de um membro bloqueado ao Tenant. Somente OWNER e ADMIN podem executar esta operação.',
  })
  @ApiParam({
    name: 'memberId',
    description: 'ID do usuário que será desbloqueado.',
  })
  @ApiResponse({
    status: 201,
    description: 'Membro desbloqueado com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário sem permissão.',
  })
  @ApiResponse({
    status: 404,
    description: 'Membro não encontrado.',
  })
  async unblockTenantMember(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    await this.unblockTenantMemberUseCase.execute({
      tenantId: tenant.tenantId,
      userId: user.sub,
      memberId,
    });
  }
}
