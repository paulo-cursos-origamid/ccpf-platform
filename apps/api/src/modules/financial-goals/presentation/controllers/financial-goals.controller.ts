import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  CurrentTenant,
  TenantContextGuard,
} from '../../../tenant/presentation';
import type { TenantContext } from '../../../tenant/presentation';

import { JwtAuthGuard } from '../../../identity/infrastructure/auth';
import { SubscriptionAccessGuard } from '../../../billing/presentation/guards/subscription-access.guard';

import { CreateFinancialGoalUseCase } from '../../application/use-cases/create-financial-goal/create-financial-goal.use-case';
import { ListFinancialGoalsUseCase } from '../../application/use-cases/list-financial-goals/list-financial-goals.use-case';
import { GetFinancialGoalUseCase } from '../../application/use-cases/get-financial-goal/get-financial-goal.use-case';
import { UpdateFinancialGoalUseCase } from '../../application/use-cases/update-financial-goal/update-financial-goal.use-case';
import { ArchiveFinancialGoalUseCase } from '../../application/use-cases/archive-financial-goal/archive-financial-goal.use-case';
import { RestoreFinancialGoalUseCase } from '../../application/use-cases/restore-financial-goal/restore-financial-goal.use-case';
import { AddFinancialGoalContributionUseCase } from '../../application/use-cases/add-financial-goal-contribution/add-financial-goal-contribution.use-case';
import { ListFinancialGoalContributionsUseCase } from '../../application/use-cases/list-financial-goal-contributions/list-financial-goal-contributions.use-case';
import { RemoveFinancialGoalContributionUseCase } from '../../application/use-cases/remove-financial-goal-contribution/remove-financial-goal-contribution.use-case';

import { CreateFinancialGoalDto } from '../dto/create-financial-goal.dto';
import { UpdateFinancialGoalDto } from '../dto/update-financial-goal.dto';
import { AddFinancialGoalContributionDto } from '../dto/add-financial-goal-contribution.dto';

@ApiTags('Financial Goals')
@ApiBearerAuth('access-token')
@ApiHeader({
  name: 'X-Tenant-Id',
  description: 'Identificador do Espaço ativo.',
  required: true,
})
@Controller('financial-goals')
@UseGuards(JwtAuthGuard, TenantContextGuard, SubscriptionAccessGuard)
export class FinancialGoalsController {
  constructor(
    private readonly createGoal: CreateFinancialGoalUseCase,
    private readonly listGoals: ListFinancialGoalsUseCase,
    private readonly getGoal: GetFinancialGoalUseCase,
    private readonly updateGoal: UpdateFinancialGoalUseCase,
    private readonly archiveGoal: ArchiveFinancialGoalUseCase,
    private readonly restoreGoal: RestoreFinancialGoalUseCase,
    private readonly addContributionUseCase: AddFinancialGoalContributionUseCase,
    private readonly listContributions: ListFinancialGoalContributionsUseCase,
    private readonly removeContribution: RemoveFinancialGoalContributionUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar meta financeira' })
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateFinancialGoalDto,
  ) {
    return this.createGoal.execute({
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      ...dto,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar metas financeiras do Espaço' })
  list(@CurrentTenant() tenant: TenantContext) {
    return this.listGoals.execute(tenant.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar meta financeira' })
  get(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.getGoal.execute({ id, tenantId: tenant.tenantId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar meta financeira' })
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateFinancialGoalDto,
  ) {
    return this.updateGoal.execute({
      id,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      ...dto,
      targetDate:
        dto.targetDate === undefined
          ? undefined
          : dto.targetDate
            ? new Date(dto.targetDate)
            : null,
    });
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Arquivar meta financeira' })
  archive(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.archiveGoal.execute({ id, tenantId: tenant.tenantId });
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Desarquivar meta financeira' })
  restore(@CurrentTenant() tenant: TenantContext, @Param('id') id: string) {
    return this.restoreGoal.execute({ id, tenantId: tenant.tenantId });
  }

  @Post(':id/contributions')
  @ApiOperation({ summary: 'Registrar aporte manual na meta' })
  addContribution(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') goalId: string,
    @Body() dto: AddFinancialGoalContributionDto,
  ) {
    return this.addContributionUseCase.execute({
      goalId,
      tenantId: tenant.tenantId,
      userId: tenant.userId,
      amount: dto.amount,
      date: dto.date ? new Date(dto.date) : new Date(),
      description: dto.description,
    });
  }

  @Get(':id/contributions')
  @ApiOperation({ summary: 'Listar aportes manuais da meta' })
  listGoalContributions(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') goalId: string,
  ) {
    return this.listContributions.execute({
      goalId,
      tenantId: tenant.tenantId,
    });
  }

  @Delete(':id/contributions/:contributionId')
  @ApiOperation({ summary: 'Remover aporte manual da meta' })
  removeGoalContribution(
    @CurrentTenant() tenant: TenantContext,
    @Param('id') goalId: string,
    @Param('contributionId') contributionId: string,
  ) {
    return this.removeContribution.execute({
      contributionId,
      goalId,
      tenantId: tenant.tenantId,
    });
  }
}
