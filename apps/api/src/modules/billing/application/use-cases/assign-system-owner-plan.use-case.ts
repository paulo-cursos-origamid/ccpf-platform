import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

/**
 * Atribui o plano interno SYSTEM_OWNER ao tenant selecionado.
 *
 * Responsabilidades:
 * - validar o tenant e o plano interno;
 * - ativar a assinatura sem modalidade comercial;
 * - não gerar fatura ou cobrança;
 * - executar as alterações dentro de uma transação.
 *
 * A autorização administrativa é aplicada no controller.
 */
@Injectable()
export class AssignSystemOwnerPlanUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string) {
    if (!tenantId) {
      throw new BadRequestException('Tenant não informado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant não encontrado.');
      }

      const plan = await tx.plan.findUnique({
        where: { code: 'SYSTEM_OWNER' },
      });

      if (!plan || !plan.isActive || plan.isPublic) {
        throw new NotFoundException(
          'O plano interno SYSTEM_OWNER não está configurado corretamente.',
        );
      }

      if (plan.maxUsers !== -1) {
        throw new BadRequestException(
          'O plano SYSTEM_OWNER deve permitir membros ilimitados.',
        );
      }

      const now = new Date();

      const currentSubscription = await tx.subscription.findFirst({
        where: {
          tenantId,
          status: {
            in: ['PENDING', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED'],
          },
        },
        orderBy: { startedAt: 'desc' },
      });

      const subscriptionData = {
        planId: plan.id,
        planPriceId: null,
        status: 'ACTIVE' as const,
        startedAt: currentSubscription?.startedAt ?? now,
        currentPeriodStart: now,
        currentPeriodEnd: new Date('9999-12-31T23:59:59.999Z'),
        billingDay: null,
        nextBillingDate: null,
        trialEndsAt: null,
        cancelledAt: null,
        pendingPlanId: null,
        pendingPlanPriceId: null,
        pendingPlanChangeType: null,
        pendingPlanEffectiveAt: null,
        pendingPlanInvoiceId: null,
        pendingBillingDay: null,
      };

      if (currentSubscription) {
        return tx.subscription.update({
          where: { id: currentSubscription.id },
          data: subscriptionData,
          include: { plan: true },
        });
      }

      return tx.subscription.create({
        data: {
          tenantId,
          ...subscriptionData,
        },
        include: { plan: true },
      });
    });
  }
}
