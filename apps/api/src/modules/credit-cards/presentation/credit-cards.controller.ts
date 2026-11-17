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
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentTenant, TenantContextGuard } from '../../tenant/presentation';
import type { TenantContext } from '../../tenant/presentation';
import { JwtAuthGuard } from '../../identity/infrastructure/auth';
import { SubscriptionAccessGuard } from '../../billing/presentation/guards/subscription-access.guard';
import { CreateCreditCardUseCase } from '../application/use-cases/create-credit-card/create-credit-card.use-case';
import { ListCreditCardsUseCase } from '../application/use-cases/list-credit-cards/list-credit-cards.use-case';
import { GetCreditCardUseCase } from '../application/use-cases/get-credit-card/get-credit-card.use-case';
import { UpdateCreditCardUseCase } from '../application/use-cases/update-credit-card/update-credit-card.use-case';
import { ArchiveCreditCardUseCase } from '../application/use-cases/archive-credit-card/archive-credit-card.use-case';
import { UpdateCreditCardPurchaseUseCase } from '../application/use-cases/update-credit-card-purchase/update-credit-card-purchase.use-case';
import { CreateCreditCardPurchaseUseCase } from '../application/use-cases/create-credit-card-purchase/create-credit-card-purchase.use-case';
import { UpdateCreditCardPurchaseDto } from './dto/update-credit-card-purchase.dto';
import { CreateCreditCardPurchaseDto } from './dto/create-credit-card-purchase.dto';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { UpdateCreditCardDto } from './dto/update-credit-card.dto';
import { PayCreditCardInvoiceUseCase } from '../application/use-cases/pay-credit-card-invoice/pay-credit-card-invoice.use-case';
import { PayCreditCardInvoiceDto } from './dto/pay-credit-card-invoice.dto';
import { ListCreditCardInvoicesUseCase } from '../application/use-cases/list-credit-card-invoices/list-credit-card-invoices.use-case';
import { GetCreditCardDashboardUseCase } from '../application/use-cases/get-credit-card-dashboard/get-credit-card-dashboard.use-case';
import { GetCreditCardInvoiceUseCase } from '../application/use-cases/get-credit-card-invoice/get-credit-card-invoice.use-case';
import { ListCreditCardInvoicesQueryDto } from './dto/list-credit-card-invoices-query.dto';

@ApiTags('Credit Cards')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'X-Tenant-Id',
  description: 'Identificador do Espaço ativo.',
  required: true,
})
@Controller('credit-cards')
@UseGuards(JwtAuthGuard, TenantContextGuard, SubscriptionAccessGuard)
export class CreditCardsController {
  constructor(
    private readonly createCard: CreateCreditCardUseCase,
    private readonly listCards: ListCreditCardsUseCase,
    private readonly getCard: GetCreditCardUseCase,
    private readonly updateCard: UpdateCreditCardUseCase,
    private readonly archiveCard: ArchiveCreditCardUseCase,
    private readonly createPurchase: CreateCreditCardPurchaseUseCase,
    private readonly updatePurchase: UpdateCreditCardPurchaseUseCase,
    private readonly payInvoice: PayCreditCardInvoiceUseCase,
    private readonly listInvoicesUseCase: ListCreditCardInvoicesUseCase,
    private readonly getInvoiceUseCase: GetCreditCardInvoiceUseCase,
    private readonly getDashboard: GetCreditCardDashboardUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar cartão de crédito' })
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateCreditCardDto,
  ) {
    return this.createCard.execute({
      ...dto,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar cartões de crédito do Espaço' })
  list(@CurrentTenant() tenant: TenantContext) {
    return this.listCards.execute({
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Consultar dashboard dos cartões de crédito' })
  getDashboardData(@CurrentTenant() tenant: TenantContext) {
    return this.getDashboard.execute({
      tenantId: tenant.tenantId,
    });
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Listar faturas e indicadores dos cartões' })
  listInvoices(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListCreditCardInvoicesQueryDto,
  ) {
    return this.listInvoicesUseCase.execute({
      tenantId: tenant.tenantId,
      ...query,
    });
  }

  @Get('invoices/:invoiceId')
  @ApiOperation({ summary: 'Consultar fatura, compras e parcelas' })
  getInvoice(
    @CurrentTenant() tenant: TenantContext,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.getInvoiceUseCase.execute({
      invoiceId,
      tenantId: tenant.tenantId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar cartão de crédito' })
  get(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.getCard.execute({
      cardId: id,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cartão de crédito' })
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateCreditCardDto,
  ) {
    return this.updateCard.execute({
      ...dto,
      cardId: id,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Arquivar cartão de crédito' })
  archive(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.archiveCard.execute({
      cardId: id,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Patch(':id/purchases/:purchaseId')
  @ApiOperation({
    summary: 'Corrigir valor e quantidade de parcelas de uma compra',
  })
  updatePurchaseEntry(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') cardId: string,
    @Param('purchaseId') purchaseId: string,
    @Body() dto: UpdateCreditCardPurchaseDto,
  ) {
    return this.updatePurchase.execute({
      ...dto,
      creditCardId: cardId,
      purchaseId,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Post(':id/purchases')
  @ApiOperation({ summary: 'Registrar compra no cartão de crédito' })
  createPurchaseEntry(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') cardId: string,
    @Body() dto: CreateCreditCardPurchaseDto,
  ) {
    return this.createPurchase.execute({
      ...dto,
      creditCardId: cardId,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
    });
  }

  @Post('invoices/:invoiceId/pay')
  @ApiOperation({ summary: 'Pagar fatura do cartão de crédito' })
  pay(
    @CurrentTenant() tenant: TenantContext,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: PayCreditCardInvoiceDto,
  ) {
    return this.payInvoice.execute({
      invoiceId,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      accountId: dto.accountId,
      settledAt: new Date(dto.settledAt),
      principalAmount: dto.principalAmount,
      interestAmount: dto.interestAmount,
      feeAmount: dto.feeAmount,
      discountAmount: dto.discountAmount,
      description: dto.description,
    });
  }
}
