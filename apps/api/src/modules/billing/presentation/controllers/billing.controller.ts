import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
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

import { ChangeSubscriptionPlanDto } from '../dto/change-subscription-plan.dto';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';

import type { TenantContext } from '../../../tenant/presentation/interfaces/tenant-context.interface';
import { CurrentTenant } from '../../../tenant/presentation/decorators/tenant-context.decorator';
import { TenantContextGuard } from '../../../tenant/presentation/guards/tenant-context.guard';

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
