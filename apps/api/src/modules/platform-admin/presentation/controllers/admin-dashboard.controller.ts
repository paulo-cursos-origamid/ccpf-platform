/**
 * Controller do dashboard administrativo da plataforma.
 *
 * Responsabilidade:
 * - Expor o endpoint de resumo administrativo.
 * - Garantir autenticação e autorização por permissão de plataforma.
 * - Informar ao caso de uso qual usuário está solicitando os dados.
 *
 * A granularidade do dashboard é resolvida pelo caso de uso com base
 * nas permissões efetivas do usuário.
 */

import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../identity/infrastructure/auth';
import { JwtAuthGuard } from '../../../identity/infrastructure/auth/jwt-auth.guard';
import { RequirePlatformPermission } from '../../../identity/presentation/decorators/platform-permission.decorator';
import { PlatformPermissionGuard } from '../../../identity/presentation/guards/platform-permission.guard';

import { GetAdminDashboardSummaryUseCase } from '../../application/use-cases/get-admin-dashboard-summary.use-case';
import { AdminDashboardSummaryDto } from '../dto/admin-dashboard-summary.dto';

@ApiTags('Platform Admin')
@ApiBearerAuth()
@Controller('platform-admin/dashboard')
@UseGuards(JwtAuthGuard, PlatformPermissionGuard)
export class AdminDashboardController {
  constructor(
    private readonly getAdminDashboardSummaryUseCase: GetAdminDashboardSummaryUseCase,
  ) {}

  @Get('summary')
  @RequirePlatformPermission('DASHBOARD_READ')
  @ApiOperation({
    summary: 'Obtém o resumo do dashboard administrativo',
  })
  @ApiOkResponse({
    type: AdminDashboardSummaryDto,
  })
  async getSummary(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdminDashboardSummaryDto> {
    return this.getAdminDashboardSummaryUseCase.execute(user.sub);
  }
}
