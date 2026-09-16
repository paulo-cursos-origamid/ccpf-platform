import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentUser,
  JwtAuthGuard,
} from '../../../identity/infrastructure/auth';

import type { AuthenticatedUser } from '../../../identity/infrastructure/auth';

import { ListMyTenantsUseCase } from '../../application/use-cases/list-my-tenants.use-case';
import { MyTenantResponseDto } from '../dto/my-tenant-response.dto';

/**
 * Controller responsável pelas operações HTTP relacionadas
 * ao contexto de Tenant do usuário autenticado.
 */
@ApiTags('Tenants')
@ApiBearerAuth('access-token')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly listMyTenantsUseCase: ListMyTenantsUseCase) {}

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
}
