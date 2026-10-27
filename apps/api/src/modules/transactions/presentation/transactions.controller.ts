import {
  ParseEnumPipe,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { JwtAuthGuard } from '../../identity/infrastructure/auth';
import { CurrentTenant, TenantContextGuard } from '../../tenant/presentation';
import type { TenantContext } from '../../tenant/presentation';
import { SubscriptionAccessGuard } from '../../billing/presentation/guards/subscription-access.guard';
import { CreateTransactionUseCase } from '../application/create-transaction.use-case';
import { CreateTransferUseCase } from '../application/create-transfer.use-case';
import { ListTransfersUseCase } from '../application/list-transfers.use-case';
import { ListTransactionsUseCase } from '../application/list-transactions.use-case';
import { ListFinancialHistoryUseCase } from '../application/list-financial-history.use-case';
import { GetTransactionUseCase } from '../application/get-transaction.use-case';
import { ReverseTransactionUseCase } from '../application/reverse-transaction.use-case';
import { ReverseTransferUseCase } from '../application/reverse-transfer.use-case';
import { CreateTransactionDto } from './create-transaction.dto';
import { CreateTransferDto } from './create-transfer.dto';

@ApiTags('Transactions')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'X-Tenant-Id',
  description: 'Identificador do Espaço ativo.',
  required: true,
})
@Controller('transactions')
@UseGuards(JwtAuthGuard, TenantContextGuard, SubscriptionAccessGuard)
export class TransactionsController {
  constructor(
    private readonly createTransaction: CreateTransactionUseCase,
    private readonly createTransfer: CreateTransferUseCase,
    private readonly listTransfers: ListTransfersUseCase,
    private readonly listTransactions: ListTransactionsUseCase,
    private readonly listFinancialHistory: ListFinancialHistoryUseCase,
    private readonly getTransaction: GetTransactionUseCase,
    private readonly reverseTransaction: ReverseTransactionUseCase,
    private readonly reverseTransfer: ReverseTransferUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Criar transação financeira',
    description: 'Registra uma receita ou despesa na conta do Espaço ativo.',
  })
  @ApiResponse({ status: 201, description: 'Transação criada com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou categoria incompatível.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem acesso à conta ou ao Espaço.' })
  @ApiResponse({
    status: 404,
    description: 'Conta ou categoria não encontrada.',
  })
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.createTransaction.execute({
      ...dto,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Get('transfers')
  @ApiOperation({
    summary: 'Listar transferências do Espaço ativo',
    description:
      'Retorna transferências não excluídas entre contas acessíveis pelo usuário.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transferências listadas com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao Espaço ativo.' })
  listTransfersForTenant(@CurrentTenant() tenant: TenantContext) {
    return this.listTransfers.execute(tenant.tenantId, tenant.userId);
  }

  @Post('transfers')
  @ApiOperation({
    summary: 'Transferir valores entre contas',
    description:
      'Registra a transferência e os lançamentos financeiros das contas de origem e destino.',
  })
  @ApiResponse({
    status: 201,
    description: 'Transferência criada com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Valor inválido ou contas iguais.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem acesso a uma das contas.' })
  @ApiResponse({
    status: 404,
    description: 'Conta não encontrada no Espaço ativo.',
  })
  transfer(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateTransferDto,
  ) {
    return this.createTransfer.execute({
      ...dto,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar transações do Espaço ativo',
    description:
      'Lista transações não excluídas acessíveis pelo usuário, com filtro opcional por tipo.',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionType,
    description: 'Filtra por INCOME ou EXPENSE.',
  })
  @ApiResponse({ status: 200, description: 'Transações listadas com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao Espaço ativo.' })
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query('type', new ParseEnumPipe(TransactionType, { optional: true }))
    type?: TransactionType,
  ) {
    return this.listTransactions.execute(tenant.tenantId, tenant.userId, type);
  }

  @Post('transfers/:id/reverse')
  @ApiOperation({ summary: 'Estornar transferência financeira' })
  reverseTransferOperation(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.reverseTransfer.execute({
      id,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Estornar receita ou despesa' })
  reverseTransactionOperation(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
  ) {
    return this.reverseTransaction.execute({
      id,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Get('history')
  @ApiOperation({
    summary: 'Consultar histórico financeiro do Espaço ativo',
  })
  listHistory(@CurrentTenant() tenant: TenantContext) {
    return this.listFinancialHistory.execute(tenant.tenantId, tenant.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Consultar transação',
    description: 'Consulta uma transação pelo identificador no Espaço ativo.',
  })
  @ApiResponse({ status: 200, description: 'Transação encontrada.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem acesso à transação.' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada.' })
  get(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.getTransaction.execute(tenant.tenantId, tenant.userId, id);
  }
}
