import { Injectable } from '@nestjs/common';
import { SubscriptionStatus as PrismaSubscriptionStatus } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

/**
 * Implementação Prisma do repositório de Subscription.
 *
 * Responsável por persistir e recuperar assinaturas comerciais.
 *
 * A infraestrutura traduz os tipos do Prisma para as entidades
 * e enums utilizados pelo domínio.
 */
@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(subscription: SubscriptionEntity): Promise<SubscriptionEntity> {
    const createdSubscription = await this.prisma.subscription.create({
      data: {
        id: subscription.id,
        tenantId: subscription.tenantId,
        planId: subscription.planId,
        status: subscription.status,
        startedAt: subscription.startedAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        cancelledAt: subscription.cancelledAt,
      },
    });

    return this.toDomain(createdSubscription);
  }

  async findById(id: string): Promise<SubscriptionEntity | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return null;
    }

    return this.toDomain(subscription);
  }

  /**
   * Retorna a assinatura corrente do Tenant.
   *
   * A integridade do banco garante que exista no máximo
   * uma assinatura corrente por Tenant.
   */
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

    if (!subscription) {
      return null;
    }

    return this.toDomain(subscription);
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
    const updatedSubscription = await this.prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        cancelledAt: subscription.cancelledAt,
      },
    });

    return this.toDomain(updatedSubscription);
  }

  /**
   * Converte um registro Prisma em uma entidade do domínio.
   */
  private toDomain(rawSubscription: {
    id: string;
    tenantId: string;
    planId: string;
    status: PrismaSubscriptionStatus;
    startedAt: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEndsAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SubscriptionEntity {
    return new SubscriptionEntity(
      rawSubscription.id,
      rawSubscription.tenantId,
      rawSubscription.planId,
      rawSubscription.status as SubscriptionStatus,
      rawSubscription.startedAt,
      rawSubscription.currentPeriodStart,
      rawSubscription.currentPeriodEnd,
      rawSubscription.trialEndsAt,
      rawSubscription.cancelledAt,
      rawSubscription.createdAt,
      rawSubscription.updatedAt,
    );
  }
}
