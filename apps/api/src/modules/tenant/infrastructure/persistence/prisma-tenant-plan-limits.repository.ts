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

    const usableStatus = {
      OR: [
        { status: SubscriptionStatus.ACTIVE },
        {
          status: SubscriptionStatus.TRIALING,
          trialEndsAt: { gt: now },
        },
      ],
    };

    // Mantém compatibilidade com uma assinatura diretamente vinculada
    // ao Tenant, inclusive a assinatura SYSTEM_OWNER do Tenant de sistema.
    const directSubscription = await this.prisma.subscription.findFirst({
      where: { tenantId, ...usableStatus },
      orderBy: { createdAt: 'desc' },
      include: { plan: { select: { maxUsers: true } } },
    });

    if (directSubscription) {
      return directSubscription.plan.maxUsers;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { billingAccountId: true },
    });

    if (!tenant?.billingAccountId) {
      return null;
    }

    const accountSubscription = await this.prisma.subscription.findFirst({
      where: {
        billingAccountId: tenant.billingAccountId,
        ...usableStatus,
      },
      orderBy: { createdAt: 'desc' },
      include: { plan: { select: { maxUsers: true } } },
    });

    return accountSubscription?.plan.maxUsers ?? null;
  }

  /**
   * Busca o limite comercial a partir de uma assinatura utilizável
   * vinculada a um Tenant do qual o usuário é OWNER.
   */
  async findMaxTenantsByUser(userId: string): Promise<number | null> {
    const now = new Date();

    const billingAccount = await this.prisma.billingAccount.findUnique({
      where: { ownerUserId: userId },
      select: { id: true },
    });

    // Não usamos a assinatura de um Tenant arbitrário como fallback.
    // Isso evita conceder SYSTEM_OWNER a uma conta comercial sem vínculo.
    if (!billingAccount) {
      return null;
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        billingAccountId: billingAccount.id,
        OR: [
          { status: SubscriptionStatus.ACTIVE },
          {
            status: SubscriptionStatus.TRIALING,
            trialEndsAt: { gt: now },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { plan: { select: { maxTenants: true } } },
    });

    return subscription?.plan.maxTenants ?? null;
  }

  async countOwnedTenantsByUser(userId: string): Promise<number> {
    return this.prisma.tenantMember.count({
      where: {
        userId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });
  }
}
