import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { CreateNotificationsForPermissionUseCase } from '../../../notifications/application/use-cases/create-notifications-for-permission.use-case';
import { NotificationSeverity } from '../../../notifications/domain/enums/notification-severity.enum';
import { NotificationType } from '../../../notifications/domain/enums/notification-type.enum';

import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { PlanPriceRepository } from '../../domain/repositories/plan-price.repository';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { BillingDateService } from '../../domain/services/billing-date.service';
import { SubscriptionLifecycleApplicationService } from '../services/subscription-lifecycle-application.service';
import { InvoiceCreationService } from '../services/invoice-creation.service';
import { BillingUnitOfWork } from '../../domain/repositories/billing-unit-of-work';

export interface CreateSubscriptionInput {
  tenantId: string;
  userId: string;
  planCode: string;
  planPriceId: string;
  billingDay?: number;
  installmentCount?: number;
}

@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly planPriceRepository: PlanPriceRepository,
    private readonly subscriptionLifecycleApplicationService: SubscriptionLifecycleApplicationService,
    private readonly billingDateService: BillingDateService,
    private readonly invoiceCreationService: InvoiceCreationService,
    private readonly billingUnitOfWork: BillingUnitOfWork,
    private readonly createNotificationsForPermissionUseCase: CreateNotificationsForPermissionUseCase,
  ) {}

  async execute(input: CreateSubscriptionInput): Promise<SubscriptionEntity> {
    const planCode = input.planCode.trim().toUpperCase();

    const plan = await this.planRepository.findByCode(planCode);

    if (!plan || !plan.isActive || !plan.isPublic) {
      throw new BadRequestException(
        'O plano selecionado não está disponível para contratação.',
      );
    }

    const planPrice = await this.planPriceRepository.findById(
      input.planPriceId,
    );

    if (!planPrice || !planPrice.isActive || planPrice.planId !== plan.id) {
      throw new BadRequestException(
        'A modalidade comercial selecionada não pertence ao plano informado ou está indisponível.',
      );
    }

    const now = new Date();
    const isTrial = plan.code === 'TRIAL';

    if (isTrial && planPrice.planId) {
      throw new BadRequestException(
        'O plano Trial não utiliza uma modalidade comercial paga.',
      );
    }

    const billingDay = isTrial
      ? null
      : this.billingDateService.validateBillingDayForInterval(
          input.billingDay,
          planPrice.interval,
        );

    const currentPeriodEnd =
      this.billingDateService.calculatePeriodEnd(now, planPrice.interval) ??
      now;

    const nextBillingDate = this.billingDateService.calculateNextBillingDate(
      now,
      billingDay,
      planPrice.interval,
    );

    const trialEndsAt = isTrial ? this.calculateTrialEnd(now) : null;

    const subscription = new SubscriptionEntity(
      randomUUID(),
      input.tenantId,
      plan.id,
      planPrice.id,
      isTrial ? SubscriptionStatus.TRIALING : SubscriptionStatus.PENDING,
      now,
      now,
      currentPeriodEnd,
      billingDay,
      nextBillingDate,
      trialEndsAt,
      null,
      now,
      now,
    );

    const persisted = await this.billingUnitOfWork.execute(async (context) => {
      const {
        subscriptionRepository,
        invoiceRepository,
        planRepository,
        planPriceRepository,
        invoiceInstallmentRepository,
      } = context;

      /**
       * Sincroniza o lifecycle dentro da mesma transação.
       *
       * Isso permite que uma assinatura TRIALING já expirada
       * seja marcada como EXPIRED antes de verificar se o Tenant
       * possui uma assinatura corrente.
       */
      const current =
        await this.subscriptionLifecycleApplicationService.synchronize(
          input.tenantId,
          context,
          now,
        );

      if (current) {
        throw new BadRequestException(
          'O Tenant já possui uma assinatura vigente.',
        );
      }

      const createdSubscription =
        await subscriptionRepository.create(subscription);

      if (!isTrial) {
        await this.invoiceCreationService.execute(
          {
            subscriptionId: createdSubscription.id,
            installmentCount: input.installmentCount,
          },
          {
            invoiceRepository,
            planRepository,
            planPriceRepository,
            subscriptionRepository,
            invoiceInstallmentRepository,
          },
        );
      }

      return createdSubscription;
    });

    try {
      await this.createNotificationsForPermissionUseCase.execute({
        permissionCode: 'USERS_READ',
        type: NotificationType.SUBSCRIPTION_CREATED,
        severity: NotificationSeverity.INFO,
        title: 'Nova assinatura criada',
        message: `Uma nova assinatura do plano ${plan.name} foi criada.`,
        resourceType: 'SUBSCRIPTION',
        resourceId: persisted.id,
        deduplicationKey: `SUBSCRIPTION_CREATED:${persisted.id}`,
      });
    } catch {
      // Notificações não podem invalidar a operação financeira concluída.
    }

    return persisted;
  }

  private calculateTrialEnd(referenceDate: Date): Date {
    const trialEndsAt = new Date(referenceDate);
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    return trialEndsAt;
  }
}
