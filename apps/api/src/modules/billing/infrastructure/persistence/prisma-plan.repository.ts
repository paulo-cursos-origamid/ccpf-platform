import { Injectable } from '@nestjs/common';
import { PlanFeatureCode as PrismaPlanFeatureCode } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { PlanEntity } from '../../domain/entities/plan.entity';
import { BillingInterval } from '../../domain/enums/billing-interval.enum';
import { PlanFeatureCode } from '../../domain/enums/plan-feature-code.enum';
import { PlanRepository } from '../../domain/repositories/plan.repository';

/**
 * Implementação Prisma do repositório de Plan.
 *
 * Responsável por traduzir os registros persistidos pelo Prisma
 * para entidades pertencentes ao domínio de Billing.
 *
 * O domínio não conhece Prisma nem os enums gerados pelo ORM.
 */
@Injectable()
export class PrismaPlanRepository implements PlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(plan: PlanEntity): Promise<PlanEntity> {
    const createdPlan = await this.prisma.plan.create({
      data: {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        maxUsers: plan.maxUsers,
        isPublic: plan.isPublic,
        isActive: plan.isActive,
        features: {
          create: plan.features.map((feature) => ({
            feature,
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

    if (!plan) {
      return null;
    }

    return this.toDomain(plan);
  }

  async findByCode(code: string): Promise<PlanEntity | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { code },
      include: {
        features: true,
      },
    });

    if (!plan) {
      return null;
    }

    return this.toDomain(plan);
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
        price: 'asc',
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
        price: plan.price,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
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

  /**
   * Converte um registro Prisma em uma entidade do domínio.
   */
  private toDomain(rawPlan: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    price: { toNumber(): number };
    currency: string;
    billingInterval: string;
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
      rawPlan.price.toNumber(),
      rawPlan.currency,
      rawPlan.billingInterval as BillingInterval,
      rawPlan.maxUsers,
      rawPlan.isPublic,
      rawPlan.isActive,
      rawPlan.features
        .filter((feature) => feature.enabled)
        .map((feature) => feature.feature as PlanFeatureCode),
      rawPlan.createdAt,
      rawPlan.updatedAt,
    );
  }
}
