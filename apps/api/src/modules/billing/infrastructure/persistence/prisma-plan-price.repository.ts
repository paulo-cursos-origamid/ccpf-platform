import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { PlanPriceEntity } from '../../domain/entities/plan-price.entity';
import { BillingInterval } from '../../domain/enums/billing-interval.enum';
import { PlanPriceRepository } from '../../domain/repositories/plan-price.repository';

/**
 * Implementação Prisma do repositório de PlanPrice.
 *
 * Responsável exclusivamente pelas modalidades comerciais.
 */
@Injectable()
export class PrismaPlanPriceRepository implements PlanPriceRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async create(planPrice: PlanPriceEntity): Promise<PlanPriceEntity> {
    const created = await this.prisma.planPrice.create({
      data: {
        id: planPrice.id,
        planId: planPrice.planId,
        interval: planPrice.interval,
        amount: new Prisma.Decimal(planPrice.amount),
        currency: planPrice.currency,
        isActive: planPrice.isActive,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<PlanPriceEntity | null> {
    const result = await this.prisma.planPrice.findUnique({
      where: { id },
    });

    return result ? this.toDomain(result) : null;
  }

  async findByPlanAndInterval(
    planId: string,
    interval: BillingInterval,
  ): Promise<PlanPriceEntity | null> {
    const result = await this.prisma.planPrice.findUnique({
      where: {
        planId_interval: {
          planId,
          interval,
        },
      },
    });

    return result ? this.toDomain(result) : null;
  }

  async findActiveByPlan(planId: string): Promise<PlanPriceEntity[]> {
    const results = await this.prisma.planPrice.findMany({
      where: {
        planId,
        isActive: true,
      },
      orderBy: {
        amount: 'asc',
      },
    });

    return results.map((result) => this.toDomain(result));
  }

  async update(planPrice: PlanPriceEntity): Promise<PlanPriceEntity> {
    const updated = await this.prisma.planPrice.update({
      where: {
        id: planPrice.id,
      },
      data: {
        interval: planPrice.interval,
        amount: new Prisma.Decimal(planPrice.amount),
        currency: planPrice.currency,
        isActive: planPrice.isActive,
      },
    });

    return this.toDomain(updated);
  }

  private toDomain(raw: {
    id: string;
    planId: string;
    interval: string;
    amount: Prisma.Decimal;
    currency: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): PlanPriceEntity {
    return new PlanPriceEntity(
      raw.id,
      raw.planId,
      raw.interval as BillingInterval,
      raw.amount.toNumber(),
      raw.currency,
      raw.isActive,
      raw.createdAt,
      raw.updatedAt,
    );
  }
}
