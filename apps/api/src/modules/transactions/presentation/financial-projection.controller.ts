import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/infrastructure/auth';
import { CurrentTenant, TenantContextGuard } from '../../tenant/presentation';
import type { TenantContext } from '../../tenant/presentation';
import { SubscriptionAccessGuard } from '../../billing/presentation/guards/subscription-access.guard';
import { GetFinancialProjectionUseCase } from '../application/get-financial-projection.use-case';

@ApiTags('Financial Projection')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'X-Tenant-Id',
  description: 'Identificador do Espaço ativo.',
  required: true,
})
@Controller('transactions/financial-projection')
@UseGuards(JwtAuthGuard, TenantContextGuard, SubscriptionAccessGuard)
export class FinancialProjectionController {
  constructor(private readonly projection: GetFinancialProjectionUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Consultar projeção financeira dos próximos 12 meses',
  })
  execute(@CurrentTenant() tenant: TenantContext) {
    return this.projection.execute(tenant.tenantId, tenant.userId);
  }
}
