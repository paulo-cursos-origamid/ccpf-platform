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
 * Representação explícita do registro de Subscription persistido pelo Prisma.
 *
 * Mantém a infraestrutura independente da tipagem gerada por
 * Prisma.SubscriptionGetPayload<{}>, evitando que o domínio conheça
 * detalhes do ORM e também evitando o uso do tipo vazio rejeitado pelo ESLint.
 */
interface PrismaSubscriptionRecord {
  id: string;
  tenantId: string;
  planId: string;
  status: PrismaSubscriptionStatus;
  startedAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt: Date | null;
  cancelledAt: Date | null;
  pendingPlanId: string | null;
  pendingPlanChangeType: PrismaSubscriptionPlanChangeType | null;
  pendingPlanEffectiveAt: Date | null;
  pendingPlanInvoiceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Implementação Prisma do repositório de Subscription.
 *
 * Responsabilidades:
 * - persistir Subscription;
 * - consultar assinaturas;
 * - traduzir enums do Prisma para enums do domínio;
 * - traduzir os campos de alteração de plano pendente.
 *
 * O repositório aceita tanto o PrismaService normal quanto o
 * Prisma.TransactionClient para funcionar dentro do BillingUnitOfWork.
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
        status: subscription.status,
        startedAt: subscription.startedAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        cancelledAt: subscription.cancelledAt,
        pendingPlanId: subscription.pendingPlanId,
        pendingPlanChangeType: subscription.pendingPlanChangeType,
        pendingPlanEffectiveAt: subscription.pendingPlanEffectiveAt,
        pendingPlanInvoiceId: subscription.pendingPlanInvoiceId,
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
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        cancelledAt: subscription.cancelledAt,
        pendingPlanId: subscription.pendingPlanId,
        pendingPlanChangeType: subscription.pendingPlanChangeType,
        pendingPlanEffectiveAt: subscription.pendingPlanEffectiveAt,
        pendingPlanInvoiceId: subscription.pendingPlanInvoiceId,
        updatedAt: subscription.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  /**
   * Converte o registro persistido para a entidade de domínio.
   */
  private toDomain(subscription: PrismaSubscriptionRecord): SubscriptionEntity {
    return new SubscriptionEntity(
      subscription.id,
      subscription.tenantId,
      subscription.planId,
      subscription.status as SubscriptionStatus,
      subscription.startedAt,
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
      subscription.trialEndsAt,
      subscription.cancelledAt,
      subscription.createdAt,
      subscription.updatedAt,
      subscription.pendingPlanId,
      subscription.pendingPlanChangeType
        ? (subscription.pendingPlanChangeType as SubscriptionPlanChangeType)
        : null,
      subscription.pendingPlanEffectiveAt,
      subscription.pendingPlanInvoiceId,
    );
  }
}
