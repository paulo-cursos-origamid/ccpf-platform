import { Inject, Injectable } from '@nestjs/common';
import {
  Prisma,
  SubscriptionPlanChangeType as PrismaSubscriptionPlanChangeType,
  SubscriptionStatus as PrismaSubscriptionStatus,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionPlanChangeType } from '../../domain/enums/subscription-plan-change-type.enum';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

/**
 * Implementação Prisma de Subscription.
 *
 * Persiste a modalidade comercial efetiva da assinatura através
 * de planPriceId e mantém a próxima cobrança em nextBillingDate.
 */
@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async create(subscription: SubscriptionEntity): Promise<SubscriptionEntity> {
    const created = await this.prisma.subscription.create({
      data: {
        id: subscription.id,
        tenantId: subscription.tenantId,
        planId: subscription.planId,
        planPriceId: subscription.planPriceId,
        status: subscription.status,
        startedAt: subscription.startedAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        billingDay: subscription.billingDay,
        nextBillingDate: subscription.nextBillingDate,
        trialEndsAt: subscription.trialEndsAt,
        cancelledAt: subscription.cancelledAt,
        pendingPlanId: subscription.pendingPlanId,
        pendingPlanPriceId: subscription.pendingPlanPriceId,
        pendingPlanChangeType: subscription.pendingPlanChangeType,
        pendingPlanEffectiveAt: subscription.pendingPlanEffectiveAt,
        pendingPlanInvoiceId: subscription.pendingPlanInvoiceId,
        pendingBillingDay: subscription.pendingBillingDay,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<SubscriptionEntity | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    return subscription ? this.toDomain(subscription) : null;
  }

  async findCurrentByTenant(
    tenantId: string,
  ): Promise<SubscriptionEntity | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        status: {
          in: [
            PrismaSubscriptionStatus.PENDING,
            PrismaSubscriptionStatus.TRIALING,
            PrismaSubscriptionStatus.ACTIVE,
            PrismaSubscriptionStatus.PAST_DUE,
            PrismaSubscriptionStatus.SUSPENDED,
          ],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscription ? this.toDomain(subscription) : null;
  }

  async findByTenant(tenantId: string): Promise<SubscriptionEntity[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscriptions.map((subscription) => this.toDomain(subscription));
  }

  async update(subscription: SubscriptionEntity): Promise<SubscriptionEntity> {
    const updated = await this.prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        planId: subscription.planId,
        planPriceId: subscription.planPriceId,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        billingDay: subscription.billingDay,
        nextBillingDate: subscription.nextBillingDate,
        trialEndsAt: subscription.trialEndsAt,
        cancelledAt: subscription.cancelledAt,
        pendingPlanId: subscription.pendingPlanId,
        pendingPlanPriceId: subscription.pendingPlanPriceId,
        pendingPlanChangeType: subscription.pendingPlanChangeType,
        pendingPlanEffectiveAt: subscription.pendingPlanEffectiveAt,
        pendingPlanInvoiceId: subscription.pendingPlanInvoiceId,
        pendingBillingDay: subscription.pendingBillingDay,
        updatedAt: subscription.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  private toDomain(subscription: {
    id: string;
    tenantId: string;
    planId: string;
    planPriceId: string | null;
    status: PrismaSubscriptionStatus;
    startedAt: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    billingDay: number | null;
    nextBillingDate: Date | null;
    trialEndsAt: Date | null;
    cancelledAt: Date | null;
    pendingPlanId: string | null;
    pendingPlanPriceId: string | null;
    pendingPlanChangeType: PrismaSubscriptionPlanChangeType | null;
    pendingPlanEffectiveAt: Date | null;
    pendingPlanInvoiceId: string | null;
    pendingBillingDay: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): SubscriptionEntity {
    return new SubscriptionEntity(
      subscription.id,
      subscription.tenantId,
      subscription.planId,
      subscription.planPriceId,
      subscription.status as SubscriptionStatus,
      subscription.startedAt,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
      subscription.billingDay,
      subscription.nextBillingDate,
      subscription.trialEndsAt,
      subscription.cancelledAt,
      subscription.createdAt,
      subscription.updatedAt,
      subscription.pendingPlanId,
      subscription.pendingPlanPriceId,
      subscription.pendingPlanChangeType
        ? (subscription.pendingPlanChangeType as SubscriptionPlanChangeType)
        : null,
      subscription.pendingPlanEffectiveAt,
      subscription.pendingPlanInvoiceId,
      subscription.pendingBillingDay,
    );
  }
}
