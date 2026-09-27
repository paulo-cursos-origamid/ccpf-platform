import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PlanEntity } from '../../domain/entities/plan.entity';
import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { BillingInterval } from '../../domain/enums/billing-interval.enum';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { SubscriptionLifecycleService } from '../services/subscription-lifecycle.service';
import { CreateInvoiceUseCase } from './invoice/create-invoice.use-case';

/**
 * Dados necessários para criar uma assinatura.
 */
export interface CreateSubscriptionInput {
  tenantId: string;
  planCode: string;
}

/**
 * Caso de uso responsável pela criação de uma assinatura comercial.
 *
 * Regras principais:
 * - o plano precisa existir;
 * - o plano precisa estar ativo;
 * - o plano precisa estar disponível publicamente para contratação;
 * - o Tenant não pode possuir outra assinatura corrente;
 * - o plano TRIAL inicia como TRIALING;
 * - planos pagos iniciam como PENDING;
 * - planos pagos geram uma Invoice pendente para cobrança.
 *
 * O processamento do pagamento não pertence a este caso de uso.
 */
@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly subscriptionLifecycleService: SubscriptionLifecycleService,
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
  ) {}

  async execute(input: CreateSubscriptionInput): Promise<SubscriptionEntity> {
    const plan = await this.planRepository.findByCode(input.planCode);

    if (!plan) {
      throw new NotFoundException('Plano não encontrado.');
    }

    if (!plan.isActive) {
      throw new BadRequestException('O plano selecionado não está ativo.');
    }

    if (!plan.isPublic) {
      throw new BadRequestException(
        'O plano selecionado não está disponível para contratação.',
      );
    }

    const currentSubscription =
      await this.subscriptionLifecycleService.resolveCurrent(input.tenantId);

    if (currentSubscription) {
      throw new BadRequestException(
        'O Tenant já possui uma assinatura vigente.',
      );
    }

    const now = new Date();
    const isTrial = plan.code === 'TRIAL';

    const currentPeriodStart = now;
    const currentPeriodEnd = this.calculatePeriodEnd(now, plan);
    const trialEndsAt = isTrial ? this.calculateTrialEnd(now) : null;

    const status = isTrial
      ? SubscriptionStatus.TRIALING
      : SubscriptionStatus.PENDING;

    const subscription = new SubscriptionEntity(
      randomUUID(),
      input.tenantId,
      plan.id,
      status,
      now,
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt,
      null,
      now,
      now,
    );

    try {
      const createdSubscription =
        await this.subscriptionRepository.create(subscription);

      /**
       * Planos pagos geram imediatamente a obrigação financeira.
       *
       * O plano TRIAL não gera Invoice porque não existe
       * cobrança comercial durante o período gratuito.
       */
      if (!isTrial) {
        await this.createInvoiceUseCase.execute({
          subscriptionId: createdSubscription.id,
        });
      }

      return createdSubscription;
    } catch (error) {
      /**
       * A verificação anterior é necessária para a experiência normal.
       * A restrição do banco protege contra requisições concorrentes.
       */
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'O Tenant já possui uma assinatura vigente.',
        );
      }

      throw error;
    }
  }

  /**
   * Calcula o final do período comercial conforme
   * o intervalo de cobrança definido pelo plano.
   */
  private calculatePeriodEnd(start: Date, plan: PlanEntity): Date {
    const end = new Date(start);

    if (plan.billingInterval === BillingInterval.YEARLY) {
      end.setFullYear(end.getFullYear() + 1);
      return end;
    }

    end.setMonth(end.getMonth() + 1);

    return end;
  }

  /**
   * Calcula o término do período gratuito do plano TRIAL.
   */
  private calculateTrialEnd(start: Date): Date {
    const trialEnd = new Date(start);

    trialEnd.setDate(trialEnd.getDate() + 14);

    return trialEnd;
  }
}
