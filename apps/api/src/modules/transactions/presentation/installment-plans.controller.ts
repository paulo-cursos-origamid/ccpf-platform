import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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
import { CreateInstallmentPlanUseCase } from '../application/installments/create-installment-plan.use-case';
import { ListInstallmentPlansUseCase } from '../application/installments/list-installment-plans.use-case';
import { CreateInstallmentPlanDto } from './create-installment-plan.dto';
import { PayInstallmentDto } from './pay-installment.dto';
import { PayInstallmentUseCase } from '../application/installments/pay-installment.use-case';

@ApiTags('Installment Plans')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'X-Tenant-Id',
  description: 'Identificador do Espaço ativo.',
  required: true,
})
@Controller('installment-plans')
@UseGuards(JwtAuthGuard, TenantContextGuard, SubscriptionAccessGuard)
export class InstallmentPlansController {
  constructor(
    private readonly createPlan: CreateInstallmentPlanUseCase,
    private readonly listPlans: ListInstallmentPlansUseCase,
    private readonly payInstallment: PayInstallmentUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar planejamento de compra parcelada',
    description:
      'Cria o plano e suas parcelas futuras sem registrar transações, ledger ou alterações de saldo.',
  })
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateInstallmentPlanDto,
  ) {
    return this.createPlan.execute({
      ...dto,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar planejamentos de compras parceladas do Espaço ativo',
  })
  list(@CurrentTenant() tenant: TenantContext) {
    return this.listPlans.execute(tenant.tenantId);
  }

  @Post(':id/installments/:installmentId/pay')
  @ApiOperation({
    summary: 'Registrar pagamento de uma parcela',
    description:
      'Registra transação, débito no Ledger, atualização do saldo e pagamento da parcela atomicamente.',
  })
  pay(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') installmentPlanId: string,
    @Param('installmentId') installmentId: string,
    @Body() dto: PayInstallmentDto,
  ) {
    return this.payInstallment.execute({
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      installmentPlanId,
      installmentId,
      paidAt: dto.paidAt,
    });
  }

}
