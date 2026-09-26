import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { TenantPlanLimitsRepository } from '../../domain/repositories/tenant-plan-limits.repository';

/**
 * Implementação Prisma responsável por consultar
 * os limites comerciais aplicáveis a um Tenant.
 *
 * A consulta atravessa Subscription -> Plan, mas essa
 * relação fica isolada na infraestrutura.
 *
 * O domínio Tenant recebe apenas o valor do limite,
 * sem conhecer as entidades ou enums do Billing.
 */
@Injectable()
export class PrismaTenantPlanLimitsRepository implements TenantPlanLimitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna o limite de usuários do plano da
   * assinatura atualmente utilizável pelo Tenant.
   *
   * Somente:
   * - ACTIVE;
   * - TRIALING cujo trial ainda não terminou
   *
   * liberam capacidade.
   *
   * Assinaturas PENDING, TRIALING expirado, PAST_DUE,
   * SUSPENDED, CANCELLED e EXPIRED não liberam capacidade.
   *
   * O valor -1 representa usuários ilimitados.
   */
  async findMaxUsersByTenant(tenantId: string): Promise<number | null> {
    const now = new Date();

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        OR: [
          {
            status: SubscriptionStatus.ACTIVE,
          },
          {
            status: SubscriptionStatus.TRIALING,
            trialEndsAt: {
              gt: now,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        plan: {
          select: {
            maxUsers: true,
          },
        },
      },
    });

    if (!subscription) {
      return null;
    }

    return subscription.plan.maxUsers;
  }
}
