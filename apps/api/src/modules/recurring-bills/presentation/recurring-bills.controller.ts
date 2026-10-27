import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../identity/infrastructure/auth';
import {
  CurrentTenant,
  TenantContextGuard,
} from '../../tenant/presentation';
import type { TenantContext } from '../../tenant/presentation';
import { SubscriptionAccessGuard } from '../../billing/presentation/guards/subscription-access.guard';

import { CreateRecurringBillUseCase } from '../application/create-recurring-bill.use-case';
import { ListRecurringBillsUseCase } from '../application/list-recurring-bills.use-case';
import { GenerateRecurringBillOccurrencesUseCase } from '../application/generate-recurring-bill-occurrences.use-case';
import { CreateRecurringBillDto } from './create-recurring-bill.dto';
import { PayRecurringBillDto } from './pay-recurring-bill.dto';
import { PayRecurringBillUseCase } from '../application/pay-recurring-bill.use-case';

@ApiTags('Recurring Bills')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'X-Tenant-Id',
  description: 'Identificador do Espaço ativo.',
  required: true,
})
@Controller('recurring-bills')
@UseGuards(JwtAuthGuard, TenantContextGuard, SubscriptionAccessGuard)
export class RecurringBillsController {
  constructor(
    private readonly createBill: CreateRecurringBillUseCase,
    private readonly listBills: ListRecurringBillsUseCase,
    private readonly generateOccurrences: GenerateRecurringBillOccurrencesUseCase,
    private readonly payBill: PayRecurringBillUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastrar conta recorrente',
    description:
      'Cadastra uma despesa recorrente sem movimentar saldo ou Ledger.',
  })
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateRecurringBillDto,
  ) {
    return this.createBill.execute({
      ...dto,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar contas recorrentes do Espaço ativo',
  })
  list(@CurrentTenant() tenant: TenantContext) {
    return this.listBills.execute(tenant.tenantId, tenant.userId);
  }

  @Post(':id/generate')
  @ApiOperation({
    summary: 'Gerar vencimentos da conta recorrente',
    description:
      'Gera vencimentos sem duplicar cobranças e sem movimentar saldo.',
  })
  generate(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.generateOccurrences.execute(
      tenant.tenantId,
      tenant.userId,
      id,
    );
  }


  @Post(':id/occurrences/:occurrenceId/pay')
  @ApiOperation({
    summary: 'Registrar pagamento de vencimento recorrente',
    description:
      'Registra despesa, Ledger, saldo e vencimento na mesma transação.',
  })
  pay(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Param('occurrenceId') occurrenceId: string,
    @Body() dto: PayRecurringBillDto,
  ) {
    return this.payBill.execute({
      ...dto,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      recurringBillId: id,
      occurrenceId,
    });
  }

}
