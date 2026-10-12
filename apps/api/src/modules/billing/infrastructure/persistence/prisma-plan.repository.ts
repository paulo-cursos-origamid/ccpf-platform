import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PlanFeatureCode as PrismaPlanFeatureCode } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { PlanEntity } from '../../domain/entities/plan.entity';
import { PlanFeatureCode } from '../../domain/enums/plan-feature-code.enum';
import { PlanRepository } from '../../domain/repositories/plan.repository';

/**
 * Implementação Prisma do repositório de Plan.
 *
 * Plan representa somente o produto.
 * Preços e periodicidades pertencem ao PlanPriceRepository.
 */
@Injectable()
export class PrismaPlanRepository implements PlanRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async create(plan: PlanEntity): Promise<PlanEntity> {
    const createdPlan = await this.prisma.plan.create({
      data: {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        description: plan.description,
        maxUsers: plan.maxUsers,
        isPublic: plan.isPublic,
        isActive: plan.isActive,
        features: {
          create: plan.features.map((feature) => ({
            feature: feature,
            enabled: true,
          })),
        },
      },
      include: {
        features: true,
      },
    });

    return this.toDomain(createdPlan);
  }

  async findById(id: string): Promise<PlanEntity | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        features: true,
      },
    });

    return plan ? this.toDomain(plan) : null;
  }

  async findByCode(code: string): Promise<PlanEntity | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { code },
      include: {
        features: true,
      },
    });

    return plan ? this.toDomain(plan) : null;
  }

  async findPublicPlans(): Promise<PlanEntity[]> {
    const plans = await this.prisma.plan.findMany({
      where: {
        isPublic: true,
        isActive: true,
      },
      include: {
        features: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return plans.map((plan) => this.toDomain(plan));
  }

  async update(plan: PlanEntity): Promise<PlanEntity> {
    const updatedPlan = await this.prisma.plan.update({
      where: {
        id: plan.id,
      },
      data: {
        name: plan.name,
        code: plan.code,
        description: plan.description,
        maxUsers: plan.maxUsers,
        isPublic: plan.isPublic,
        isActive: plan.isActive,
      },
      include: {
        features: true,
      },
    });

    return this.toDomain(updatedPlan);
  }

  private toDomain(rawPlan: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    maxUsers: number;
    isPublic: boolean;
    isActive: boolean;
    features: Array<{
      feature: PrismaPlanFeatureCode;
      enabled: boolean;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): PlanEntity {
    return new PlanEntity(
      rawPlan.id,
      rawPlan.name,
      rawPlan.code,
      rawPlan.description,
      rawPlan.maxUsers,
      rawPlan.isPublic,
      rawPlan.isActive,
      rawPlan.features
        .filter((feature) => feature.enabled)
        .map((feature) => {
          if (
            !Object.values(PlanFeatureCode).includes(
              feature.feature as unknown as PlanFeatureCode,
            )
          ) {
            throw new Error(
              `PlanFeatureCode inválido encontrado no banco: ${feature.feature}`,
            );
          }

          return feature.feature as unknown as PlanFeatureCode;
        }),
      rawPlan.createdAt,
      rawPlan.updatedAt,
    );
  }
}
