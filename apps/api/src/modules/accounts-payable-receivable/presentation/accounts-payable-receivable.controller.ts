import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identity/infrastructure/auth';
import { CurrentTenant, TenantContextGuard } from '../../tenant/presentation';
import type { TenantContext } from '../../tenant/presentation';
import { SubscriptionAccessGuard } from '../../billing/presentation/guards/subscription-access.guard';
import { CancelFinancialObligationUseCase } from '../application/use-cases/cancel-financial-obligation/cancel-financial-obligation.use-case';
import { CreateFinancialObligationUseCase } from '../application/use-cases/create-financial-obligation/create-financial-obligation.use-case';
import { GetFinancialObligationUseCase } from '../application/use-cases/get-financial-obligation/get-financial-obligation.use-case';
import { ListFinancialObligationsUseCase } from '../application/use-cases/list-financial-obligations/list-financial-obligations.use-case';
import { SettleFinancialObligationUseCase } from '../application/use-cases/settle-financial-obligation/settle-financial-obligation.use-case';
import { UpdateFinancialObligationUseCase } from '../application/use-cases/update-financial-obligation/update-financial-obligation.use-case';
import {
  CreateFinancialObligationDto,
  FinancialObligationResponseDto,
  ListFinancialObligationsQuery,
  SettleFinancialObligationDto,
  UpdateFinancialObligationDto,
} from './accounts-payable-receivable.dto';

@ApiTags('Accounts Payable/Receivable')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'X-Tenant-Id',
  description: 'Identificador do Espaço ativo.',
  required: true,
})
@Controller('financial-obligations')
@UseGuards(JwtAuthGuard, TenantContextGuard, SubscriptionAccessGuard)
export class AccountsPayableReceivableController {
  constructor(
    private readonly createObligation: CreateFinancialObligationUseCase,
    private readonly listObligations: ListFinancialObligationsUseCase,
    private readonly getObligation: GetFinancialObligationUseCase,
    private readonly updateObligation: UpdateFinancialObligationUseCase,
    private readonly settleObligation: SettleFinancialObligationUseCase,
    private readonly cancelObligation: CancelFinancialObligationUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastrar compromisso a pagar ou receber',
    description:
      'Cadastra um compromisso sem movimentar saldo, Ledger ou transações.',
  })
  @ApiCreatedResponse({
    description: 'Compromisso criado sem movimentar saldo ou transações.',
    type: FinancialObligationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido ou categoria incompatível.',
  })
  @ApiForbiddenResponse({
    description: 'Usuário sem acesso de escrita à conta.',
  })
  @ApiNotFoundResponse({
    description: 'Conta ou referência não encontrada no Espaço.',
  })
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateFinancialObligationDto,
  ) {
    return this.createObligation.execute({
      ...dto,
      dueDate: new Date(dto.dueDate),
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar compromissos do Espaço ativo',
    description:
      'Aceita filtros opcionais por tipo (PAYABLE/RECEIVABLE) e estado.',
  })
  @ApiOkResponse({ type: [FinancialObligationResponseDto] })
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListFinancialObligationsQuery,
  ) {
    return this.listObligations.execute(tenant.tenantId, tenant.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar compromisso' })
  @ApiOkResponse({ type: FinancialObligationResponseDto })
  @ApiNotFoundResponse({
    description: 'Compromisso não encontrado ou sem acesso à conta.',
  })
  get(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.getObligation.execute(id, tenant.tenantId, tenant.userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar compromisso pendente',
    description:
      'Compromissos liquidados ou cancelados não podem ser alterados.',
  })
  @ApiOkResponse({ type: FinancialObligationResponseDto })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou categoria incompatível.',
  })
  @ApiConflictResponse({
    description: 'O compromisso deixou de estar pendente.',
  })
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateFinancialObligationDto,
  ) {
    return this.updateObligation.execute({
      ...dto,
      id,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      dueDate: dto.dueDate === undefined ? undefined : new Date(dto.dueDate),
    });
  }

  @Post(':id/settle')
  @ApiOperation({
    summary: 'Liquidar compromisso',
    description:
      'Para compromissos comuns, cria ou vincula uma transação. Para faturas de cartão, registra débito no Ledger sem criar nova transação ou duplicar despesa.',
  })
  @ApiOkResponse({
    type: FinancialObligationResponseDto,
    description:
      'Compromisso liquidado. Faturas de cartão registram a movimentação no Ledger sem transação associada.',
  })
  @ApiBadRequestResponse({
    description: 'A transação informada não corresponde ao compromisso.',
  })
  @ApiConflictResponse({
    description: 'A liquidação já ocorreu ou perdeu uma disputa concorrente.',
  })
  @ApiForbiddenResponse({
    description: 'Usuário sem permissão para liquidar a conta.',
  })
  settle(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: SettleFinancialObligationDto,
  ) {
    return this.settleObligation.execute({
      ...dto,
      id,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      settledAt: new Date(dto.settledAt),
    });
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar compromisso pendente' })
  @ApiOkResponse({ type: FinancialObligationResponseDto })
  @ApiConflictResponse({
    description: 'Somente compromissos pendentes podem ser cancelados.',
  })
  cancel(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.cancelObligation.execute(id, tenant.tenantId, tenant.userId);
  }
}
