import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CancelSubscriptionUseCase } from '../../application/use-cases/cancel-subscription.use-case';
import { ChangeSubscriptionPlanUseCase } from '../../application/use-cases/change-subscription-plan/change-subscription-plan.use-case';
import { CreateSubscriptionUseCase } from '../../application/use-cases/create-subscription.use-case';
import { GetTenantSubscriptionUseCase } from '../../application/use-cases/get-tenant-subscription.use-case';
import { ListPublicPlansUseCase } from '../../application/use-cases/list-public-plans.use-case';
import { ListTenantInvoicesUseCase } from '../../application/use-cases/invoice/list-tenant-invoices.use-case';
import { GetTenantInvoiceUseCase } from '../../application/use-cases/invoice/get-tenant-invoice.use-case';
import { GetAdminInvoiceUseCase } from '../../application/use-cases/admin/get-admin-invoice.use-case';
import { ListAdminInvoicesUseCase } from '../../application/use-cases/admin/list-admin-invoices.use-case';
import { CreatePaymentUseCase } from '../../application/use-cases/payment/create-payment.use-case';
import { ConfirmPaymentUseCase } from '../../application/use-cases/payment/confirm-payment.use-case';

import { ChangeSubscriptionPlanDto } from '../dto/change-subscription-plan.dto';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import { ListAdminInvoicesQueryDto } from '../dto/list-admin-invoices.query.dto';

import type { TenantContext } from '../../../tenant/presentation/interfaces/tenant-context.interface';
import { CurrentTenant } from '../../../tenant/presentation/decorators/tenant-context.decorator';
import { TenantContextGuard } from '../../../tenant/presentation/guards/tenant-context.guard';

import { ActivateSubscriptionUseCase } from '../../application/use-cases/activate-subscription.use-case';

import { RequirePlatformPermission } from '../../../identity/presentation/decorators/platform-permission.decorator';
import { PlatformPermissionGuard } from '../../../identity/presentation/guards/platform-permission.guard';

import {
  CurrentUser,
  type AuthenticatedUser,
  JwtAuthGuard,
} from '../../../identity/infrastructure/auth';

/**
 * Controller responsável pelos endpoints relacionados
 * ao Billing e às assinaturas comerciais.
 */
@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly listPublicPlansUseCase: ListPublicPlansUseCase,
    private readonly getTenantSubscriptionUseCase: GetTenantSubscriptionUseCase,
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly changeSubscriptionPlanUseCase: ChangeSubscriptionPlanUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly activateSubscriptionUseCase: ActivateSubscriptionUseCase,
    private readonly listTenantInvoicesUseCase: ListTenantInvoicesUseCase,
    private readonly getTenantInvoiceUseCase: GetTenantInvoiceUseCase,
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
    private readonly listAdminInvoicesUseCase: ListAdminInvoicesUseCase,
    private readonly getAdminInvoiceUseCase: GetAdminInvoiceUseCase,
  ) {}

  /**
   * Lista os planos comerciais disponíveis publicamente.
   *
   * Este endpoint não exige autenticação porque é utilizado
   * pela Landing Page e pelos fluxos públicos de apresentação
   * dos planos.
   */
  @Get('plans')
  @ApiOperation({
    summary: 'Lista os planos públicos',
    description:
      'Retorna os planos comerciais ativos disponibilizados publicamente pelo CCPF.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos públicos retornada com sucesso.',
  })
  async listPublicPlans() {
    return this.listPublicPlansUseCase.execute();
  }

  /**
   * Retorna a assinatura corrente do Tenant ativo.
   *
   * O Tenant é identificado através do header X-Tenant-Id,
   * validado pelo TenantContextGuard.
   */
  @Get('subscription')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Consultar assinatura do Tenant',
    description:
      'Retorna a assinatura corrente do Tenant ativo. Caso não exista uma assinatura corrente, retorna null.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assinatura do Tenant retornada com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Tenant não informado ou usuário sem acesso ao Tenant.',
  })
  async getTenantSubscription(@CurrentTenant() tenant: TenantContext) {
    return this.getTenantSubscriptionUseCase.execute(tenant.tenantId);
  }

  /**
   * Altera o plano da assinatura corrente do Tenant ativo.
   *
   * Somente o OWNER pode executar esta operação.
   *
   * ACTIVE troca imediatamente de plano.
   * TRIALING convertido para plano pago passa para PENDING
   * até que a confirmação do pagamento seja implementada.
   */
  @Patch('subscription/plan')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Alterar plano da assinatura',
    description:
      'Altera o plano da assinatura corrente. ACTIVE troca imediatamente. TRIALING convertido para plano pago entra em PENDING até confirmação do pagamento. Downgrades que ultrapassem o limite de membros são rejeitados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plano da assinatura alterado com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'A assinatura ou o plano de destino não permite a alteração.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui permissão para alterar o plano.',
  })
  @ApiResponse({
    status: 404,
    description: 'Plano ou assinatura não encontrados.',
  })
  @ApiResponse({
    status: 409,
    description:
      'O plano já é o atual ou a quantidade atual de membros excede a capacidade do plano de destino.',
  })
  async changeSubscriptionPlan(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeSubscriptionPlanDto,
  ) {
    return this.changeSubscriptionPlanUseCase.execute({
      tenantId: tenant.tenantId,
      userId: user.sub,
      planCode: dto.planCode,
    });
  }

  /**
   * Cancela imediatamente a assinatura corrente do Tenant.
   *
   * Somente o OWNER pode executar esta operação.
   *
   * O cancelamento altera o estado para CANCELLED e encerra
   * imediatamente o acesso comercial concedido pela assinatura.
   */
  @Patch('subscription/cancel')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cancelar assinatura',
    description:
      'Cancela imediatamente a assinatura corrente do Tenant. Somente o OWNER pode executar esta operação. Após o cancelamento, a assinatura fica em estado CANCELLED e deixa de conceder acesso comercial.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assinatura cancelada com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Usuário sem acesso ao Tenant, sem permissão de OWNER ou Tenant sem assinatura corrente.',
  })
  async cancelSubscription(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cancelSubscriptionUseCase.execute({
      tenantId: tenant.tenantId,
      userId: user.sub,
    });
  }

  /**
   * Lista globalmente as Invoices para o painel administrativo.
   *
   * Este endpoint não utiliza TenantContextGuard.
   * O acesso é controlado pela permissão global BILLING_MANAGE.
   */
  @Get('admin/invoices')
  @UseGuards(JwtAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission('BILLING_MANAGE')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Listar Invoices no Admin',
    description:
      'Retorna uma lista global e paginada de Invoices de todos os Tenants. Permite busca por número da Invoice, nome do Tenant ou slug e filtro por status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista administrativa de Invoices retornada com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui a permissão global BILLING_MANAGE.',
  })
  async listAdminInvoices(@Query() query: ListAdminInvoicesQueryDto) {
    return this.listAdminInvoicesUseCase.execute(query);
  }

  /**
   * Consulta globalmente uma Invoice para o painel administrativo.
   *
   * O resultado inclui Tenant, Subscription, Plan e Payments.
   */
  @Get('admin/invoices/:invoiceId')
  @UseGuards(JwtAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission('BILLING_MANAGE')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Consultar Invoice no Admin',
    description:
      'Retorna os dados completos de uma Invoice para o painel administrativo, incluindo Tenant, Subscription, Plan e Payments.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice administrativa retornada com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui a permissão global BILLING_MANAGE.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice não encontrada.',
  })
  async getAdminInvoice(@Param('invoiceId') invoiceId: string) {
    return this.getAdminInvoiceUseCase.execute({
      invoiceId,
    });
  }

  /**
   * Lista as Invoices do Tenant ativo.
   */
  @Get('invoices')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Listar Invoices do Tenant',
    description: 'Retorna as Invoices pertencentes ao Tenant ativo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoices retornadas com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário sem acesso ao Tenant.',
  })
  async listTenantInvoices(@CurrentTenant() tenant: TenantContext) {
    return this.listTenantInvoicesUseCase.execute(tenant.tenantId);
  }

  /**
   * Consulta uma Invoice específica dentro do Tenant ativo.
   */
  @Get('invoices/:invoiceId')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Consultar Invoice',
    description: 'Retorna uma Invoice pertencente ao Tenant ativo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice retornada com sucesso.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'A Invoice pertence a outro Tenant.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice não encontrada.',
  })
  async getTenantInvoice(
    @CurrentTenant() tenant: TenantContext,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.getTenantInvoiceUseCase.execute({
      tenantId: tenant.tenantId,
      invoiceId,
    });
  }

  /**
   * Cria uma tentativa de pagamento para uma Invoice.
   *
   * Somente o OWNER do Tenant pode iniciar o pagamento.
   */
  @Post('invoices/:invoiceId/payments')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Criar pagamento da Invoice',
    description:
      'Cria uma tentativa de pagamento manual utilizando PIX ou BANK_SLIP. Somente o OWNER pode iniciar o pagamento.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pagamento criado com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados do pagamento ou estado da Invoice inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não é OWNER ou Invoice pertence a outro Tenant.',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice não encontrada.',
  })
  async createPayment(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.createPaymentUseCase.execute({
      tenantId: tenant.tenantId,
      userId: user.sub,
      invoiceId,
      method: dto.method,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      externalReference: dto.externalReference,
      pixCopyPaste: dto.pixCopyPaste,
      bankSlipBarcode: dto.bankSlipBarcode,
      bankSlipDigitableLine: dto.bankSlipDigitableLine,
      metadata: dto.metadata,
    });
  }

  /**
   * Confirma manualmente um Payment.
   *
   * Não utiliza TenantContextGuard porque a operação pertence
   * ao controle financeiro global da plataforma.
   */
  @Patch('payments/:paymentId/confirm')
  @UseGuards(JwtAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission('BILLING_MANAGE')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Confirmar pagamento',
    description:
      'Confirma manualmente um Payment e, quando aplicável, quita a Invoice e ativa a Subscription. Exige BILLING_MANAGE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pagamento confirmado com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Pagamento, Invoice ou Subscription em estado inválido.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Usuário não possui BILLING_MANAGE.',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment, Invoice ou Subscription não encontrados.',
  })
  async confirmPayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.confirmPaymentUseCase.execute({
      paymentId,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
    });
  }

  /**
   * Ativa administrativamente uma assinatura PENDING.
   *
   * Esta operação representa a confirmação interna do pagamento.
   *
   * Não utiliza TenantContextGuard porque o operador é um
   * administrador da plataforma que pode atuar sobre qualquer Tenant
   * para o qual possua a permissão BILLING_MANAGE.
   */
  @Patch('subscriptions/:subscriptionId/activate')
  @UseGuards(JwtAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission('BILLING_MANAGE')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Ativar assinatura',
    description:
      'Confirma administrativamente uma assinatura PENDING e altera seu estado para ACTIVE. Exige a permissão global BILLING_MANAGE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assinatura ativada com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'A assinatura não está em estado PENDING ou já está ativa.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Usuário autenticado não possui a permissão global BILLING_MANAGE.',
  })
  @ApiResponse({
    status: 404,
    description: 'Assinatura não encontrada.',
  })
  async activateSubscription(@Param('subscriptionId') subscriptionId: string) {
    return this.activateSubscriptionUseCase.execute({
      subscriptionId,
    });
  }
  /**
   * Cria uma assinatura para o Tenant ativo.
   *
   * O Tenant não é recebido pelo body.
   * O TenantContextGuard valida o header X-Tenant-Id
   * e disponibiliza o contexto através de @CurrentTenant().
   */
  @Post('subscription')
  @UseGuards(JwtAuthGuard, TenantContextGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Criar assinatura',
    description:
      'Cria uma nova assinatura para o Tenant ativo. Planos pagos entram em PENDING até a confirmação do pagamento. O plano TRIAL inicia em TRIALING.',
  })
  @ApiResponse({
    status: 201,
    description: 'Assinatura criada com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Plano inválido, plano indisponível ou Tenant já possui uma assinatura vigente.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflito de concorrência: o Tenant já recebeu uma assinatura vigente.',
  })
  @ApiResponse({
    status: 401,
    description: 'Usuário não autenticado.',
  })
  @ApiResponse({
    status: 403,
    description: 'Tenant não informado ou usuário sem acesso ao Tenant.',
  })
  @ApiResponse({
    status: 404,
    description: 'Plano não encontrado.',
  })
  async createSubscription(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.createSubscriptionUseCase.execute({
      tenantId: tenant.tenantId,
      planCode: dto.planCode,
    });
  }
}
