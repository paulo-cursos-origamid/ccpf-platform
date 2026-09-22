import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateSubscriptionUseCase } from '../../application/use-cases/create-subscription.use-case';
import { GetTenantSubscriptionUseCase } from '../../application/use-cases/get-tenant-subscription.use-case';
import { ListPublicPlansUseCase } from '../../application/use-cases/list-public-plans.use-case';

import { CreateSubscriptionDto } from '../dto/create-subscription.dto';

import type { TenantContext } from '../../../tenant/presentation/interfaces/tenant-context.interface';
import { CurrentTenant } from '../../../tenant/presentation/decorators/tenant-context.decorator';
import { TenantContextGuard } from '../../../tenant/presentation/guards/tenant-context.guard';

import { JwtAuthGuard } from '../../../identity/infrastructure/auth';

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
   * Retorna a assinatura vigente do Tenant ativo.
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
      'Retorna a assinatura vigente do Tenant ativo. Caso não exista uma assinatura vigente, retorna null.',
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
