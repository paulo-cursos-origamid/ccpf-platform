import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PlanEntity } from '../../../domain/entities/plan.entity';
import { PlanPriceEntity } from '../../../domain/entities/plan-price.entity';
import { SubscriptionEntity } from '../../../domain/entities/subscription.entity';
import { BillingInterval } from '../../../domain/enums/billing-interval.enum';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum';
import { TenantRole } from '../../../../tenant/domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { BillingUnitOfWork } from '../../../domain/repositories/billing-unit-of-work';
import { InvoiceCreationService } from '../../services/invoice-creation.service';
import { SubscriptionLifecycleApplicationService } from '../../services/subscription-lifecycle-application.service';
import { BillingDateService } from '../../../domain/services/billing-date.service';
import { CreateNotificationsForPermissionUseCase } from '../../../../notifications/application/use-cases/create-notifications-for-permission.use-case';
import { NotificationSeverity } from '../../../../notifications/domain/enums/notification-severity.enum';
import { NotificationType } from '../../../../notifications/domain/enums/notification-type.enum';

export interface ChangeSubscriptionPlanInput {
  tenantId: string;
  userId: string;
  planCode: string;
  planPriceId: string;
  billingDay?: number;
}

@Injectable()
export class ChangeSubscriptionPlanUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
    private readonly billingUnitOfWork: BillingUnitOfWork,
    private readonly subscriptionLifecycleApplicationService: SubscriptionLifecycleApplicationService,
    private readonly invoiceCreationService: InvoiceCreationService,
    private readonly billingDateService: BillingDateService,
    private readonly createNotificationsForPermissionUseCase: CreateNotificationsForPermissionUseCase,
  ) {}

  async execute(
    input: ChangeSubscriptionPlanInput,
  ): Promise<SubscriptionEntity> {
    /*
     * Autorização é uma preocupação externa ao agregado financeiro.
     * A validação do OWNER ocorre antes da transação.
     */
    const tenantMember = await this.tenantMemberRepository.findByTenantAndUser(
      input.tenantId,
      input.userId,
    );

    if (!tenantMember || tenantMember.role !== TenantRole.OWNER) {
      throw new ForbiddenException(
        'Apenas o OWNER do Tenant pode alterar o plano da assinatura.',
      );
    }

    const now = new Date();

    /*
     * Toda a decisão comercial ocorre dentro de uma única transação.
     *
     * Isso garante que:
     * - a Subscription seja bloqueada antes da decisão;
     * - o lifecycle seja sincronizado usando o mesmo estado;
     * - Plan/PlanPrice sejam lidos pelo mesmo contexto transacional;
     * - proration utilize o preço efetivamente carregado dentro da transação;
     * - eventual Invoice e alteração da Subscription tenham commit atômico.
     */
    const changedSubscription = await this.billingUnitOfWork.execute(
      async (context) => {
        const current =
          await context.subscriptionRepository.findCurrentByTenant(
            input.tenantId,
          );

        if (!current) {
          throw new NotFoundException(
            'Nenhuma assinatura ativa foi encontrada para o Tenant.',
          );
        }

        await context.lockSubscription(current.id);

        const synchronizedSubscription =
          await this.subscriptionLifecycleApplicationService.synchronize(
            input.tenantId,
            context,
            now,
          );

        if (!synchronizedSubscription) {
          throw new NotFoundException(
            'Nenhuma assinatura ativa foi encontrada para o Tenant.',
          );
        }

        if (synchronizedSubscription.hasPendingPlanChange) {
          throw new ConflictException(
            'A assinatura já possui uma alteração de plano pendente.',
          );
        }

        if (
          synchronizedSubscription.status !== SubscriptionStatus.ACTIVE &&
          synchronizedSubscription.status !== SubscriptionStatus.TRIALING
        ) {
          throw new BadRequestException(
            'A assinatura atual não permite alteração de plano.',
          );
        }

        const currentPlan = await context.planRepository.findById(
          synchronizedSubscription.planId,
        );

        if (!currentPlan) {
          throw new NotFoundException(
            'Plano atual da assinatura não encontrado.',
          );
        }

        const targetPlan = await context.planRepository.findByCode(
          input.planCode,
        );

        if (!targetPlan) {
          throw new NotFoundException('Plano de destino não encontrado.');
        }

        if (!targetPlan.isActive || !targetPlan.isPublic) {
          throw new BadRequestException(
            'O plano de destino não está disponível para contratação.',
          );
        }

        if (targetPlan.code === 'TRIAL') {
          throw new BadRequestException(
            'O plano TRIAL é reservado para a contratação inicial.',
          );
        }

        const targetPrice = await this.resolvePlanPrice(
          targetPlan,
          input.planPriceId,
          context.planPriceRepository,
        );

        const samePlan = targetPlan.id === currentPlan.id;

        if (
          samePlan &&
          synchronizedSubscription.planPriceId === targetPrice.id
        ) {
          throw new ConflictException(
            'A assinatura já está vinculada ao plano e modalidade informados.',
          );
        }

        const targetBillingDay =
          this.billingDateService.validateBillingDayForInterval(
            input.billingDay ??
              synchronizedSubscription.billingDay ??
              undefined,
            targetPrice.interval,
          );

        /*
         * Durante o Trial a contratação paga substitui a assinatura
         * de avaliação e gera a primeira Invoice integral.
         */
        if (synchronizedSubscription.status === SubscriptionStatus.TRIALING) {
          await this.validateTargetCapacity(input.tenantId, targetPlan);

          synchronizedSubscription.changePlan(
            targetPlan.id,
            targetPrice.id,
            now,
          );

          synchronizedSubscription.billingDay = targetBillingDay;

          synchronizedSubscription.nextBillingDate =
            this.billingDateService.calculateNextBillingDate(
              now,
              targetBillingDay,
              targetPrice.interval,
            );

          synchronizedSubscription.currentPeriodEnd =
            this.billingDateService.calculatePeriodEnd(
              now,
              targetPrice.interval,
              targetBillingDay,
            ) ?? now;

          synchronizedSubscription.markAsPending(now);

          const persistedSubscription =
            await context.subscriptionRepository.update(
              synchronizedSubscription,
            );

          await this.invoiceCreationService.execute(
            {
              subscriptionId: persistedSubscription.id,
              installmentCount: 1,
            },
            {
              invoiceRepository: context.invoiceRepository,
              planRepository: context.planRepository,
              planPriceRepository: context.planPriceRepository,
              subscriptionRepository: context.subscriptionRepository,
              invoiceInstallmentRepository:
                context.invoiceInstallmentRepository,
            },
          );

          return persistedSubscription;
        }

        const currentPrice = await this.resolveCurrentPlanPrice(
          synchronizedSubscription,
          context.planPriceRepository,
        );

        /*
         * Lifetime representa uma contratação definitiva.
         * Não permitimos retornar para uma modalidade recorrente,
         * pois não existe um ciclo futuro equivalente para aplicar
         * crédito ou determinar uma devolução financeira segura.
         */
        if (currentPrice.isLifetime && targetPrice.isRecurring) {
          throw new BadRequestException(
            'Uma assinatura Lifetime não pode ser convertida para uma modalidade recorrente.',
          );
        }

        const currentCapacity = this.resolveMaxUsers(currentPlan);
        const targetCapacity = this.resolveMaxUsers(targetPlan);

        /*
         * A capacidade do produto determina a direção de uma mudança
         * entre planos diferentes.
         *
         * O preço nunca deve transformar um aumento de capacidade em
         * downgrade ou uma redução de capacidade em upgrade.
         */
        const capacityComparison = this.compareCapacity(
          currentCapacity,
          targetCapacity,
        );

        /*
         * Quando os planos possuem a mesma capacidade, a direção
         * comercial passa a ser determinada pela modalidade.
         *
         * Isso também cobre dois produtos distintos com a mesma
         * capacidade contratual.
         */
        const changeDirection = samePlan
          ? this.compareBillingIntervals(
              currentPrice.interval,
              targetPrice.interval,
            )
          : capacityComparison !== 0
            ? capacityComparison
            : this.compareBillingIntervals(
                currentPrice.interval,
                targetPrice.interval,
              );

        if (changeDirection === 0) {
          throw new BadRequestException(
            'O plano e a modalidade de destino não representam uma alteração comercial válida.',
          );
        }

        if (changeDirection < 0) {
          /*
           * Downgrade:
           * - não altera o produto atual imediatamente;
           * - não gera nova Invoice;
           * - agenda a mudança para o encerramento do ciclo atual.
           */
          await this.validateCapacityReduction(
            input.tenantId,
            currentPlan,
            targetPlan,
          );

          const effectiveAt =
            synchronizedSubscription.currentPeriodEnd.getTime() > now.getTime()
              ? synchronizedSubscription.currentPeriodEnd
              : now;

          synchronizedSubscription.scheduleDowngrade(
            targetPlan.id,
            targetPrice.id,
            targetBillingDay,
            effectiveAt,
            now,
          );

          return context.subscriptionRepository.update(
            synchronizedSubscription,
          );
        }

        /*
         * Upgrade:
         * - calcula a cobrança proporcional;
         * - gera Invoice quando existe valor a pagar;
         * - mantém a alteração pendente até a confirmação do pagamento.
         */
        await this.validateTargetCapacity(input.tenantId, targetPlan);

        const amount = this.calculateProratedAmount(
          currentPrice,
          targetPrice,
          synchronizedSubscription,
          now,
        );

        if (amount <= 0) {
          /*
           * Um upgrade sem saldo adicional não precisa de Invoice.
           * Nesse caso a alteração pode ser aplicada imediatamente.
           */
          synchronizedSubscription.changePlan(
            targetPlan.id,
            targetPrice.id,
            now,
          );

          synchronizedSubscription.billingDay = targetBillingDay;

          synchronizedSubscription.nextBillingDate =
            this.billingDateService.calculateNextBillingDate(
              now,
              targetBillingDay,
              targetPrice.interval,
            );

          synchronizedSubscription.currentPeriodStart = now;
          synchronizedSubscription.currentPeriodEnd =
            this.billingDateService.calculatePeriodEnd(
              now,
              targetPrice.interval,
              targetBillingDay,
            ) ?? now;

          return context.subscriptionRepository.update(
            synchronizedSubscription,
          );
        }

        const invoice = await this.invoiceCreationService.execute(
          {
            subscriptionId: synchronizedSubscription.id,
            amount,
            installmentCount: 1,
          },
          {
            invoiceRepository: context.invoiceRepository,
            planRepository: context.planRepository,
            planPriceRepository: context.planPriceRepository,
            subscriptionRepository: context.subscriptionRepository,
            invoiceInstallmentRepository: context.invoiceInstallmentRepository,
          },
        );

        synchronizedSubscription.scheduleUpgrade(
          targetPlan.id,
          targetPrice.id,
          invoice.id,
          targetBillingDay,
          now,
          now,
        );

        return context.subscriptionRepository.update(synchronizedSubscription);
      },
    );

    /*
     * Notificação é deliberadamente executada depois do commit financeiro.
     * Se a transação falhar, nenhuma notificação de alteração é emitida.
     */
    await this.notifySubscriptionChanged(changedSubscription);

    return changedSubscription;
  }

  private async resolvePlanPrice(
    plan: PlanEntity,
    planPriceId: string,
    planPriceRepository: {
      findById(id: string): Promise<PlanPriceEntity | null>;
    },
  ): Promise<PlanPriceEntity> {
    const planPrice = await planPriceRepository.findById(planPriceId);

    if (!planPrice) {
      throw new NotFoundException(
        'A modalidade comercial selecionada não foi encontrada.',
      );
    }

    if (planPrice.planId !== plan.id) {
      throw new BadRequestException(
        'A modalidade comercial selecionada não pertence ao plano informado.',
      );
    }

    if (!planPrice.isActive) {
      throw new BadRequestException(
        'A modalidade comercial selecionada não está ativa.',
      );
    }

    if (planPrice.amount <= 0) {
      throw new BadRequestException(
        'A modalidade comercial selecionada possui valor inválido.',
      );
    }

    return planPrice;
  }

  private async resolveCurrentPlanPrice(
    subscription: SubscriptionEntity,
    planPriceRepository: {
      findById(id: string): Promise<PlanPriceEntity | null>;
    },
  ): Promise<PlanPriceEntity> {
    if (!subscription.planPriceId) {
      throw new BadRequestException(
        'A assinatura atual não possui uma modalidade comercial.',
      );
    }

    const planPrice = await planPriceRepository.findById(
      subscription.planPriceId,
    );

    if (!planPrice) {
      throw new NotFoundException(
        'A modalidade comercial atual da assinatura não foi encontrada.',
      );
    }

    return planPrice;
  }

  private compareCapacity(
    currentCapacity: number,
    targetCapacity: number,
  ): number {
    /*
     * -1 = redução de capacidade
     *  0 = mesma capacidade
     *  1 = aumento de capacidade
     *
     * -1 representa capacidade ilimitada e é sempre superior
     * a qualquer capacidade finita.
     */
    if (currentCapacity === targetCapacity) {
      return 0;
    }

    if (currentCapacity === -1) {
      return -1;
    }

    if (targetCapacity === -1) {
      return 1;
    }

    return targetCapacity > currentCapacity ? 1 : -1;
  }

  private compareBillingIntervals(
    currentInterval: BillingInterval,
    targetInterval: BillingInterval,
  ): number {
    if (currentInterval === targetInterval) {
      return 0;
    }

    /*
     * Semestral → Anual:
     * upgrade comercial.
     *
     * Anual → Semestral:
     * downgrade comercial.
     *
     * Qualquer modalidade recorrente → Lifetime:
     * upgrade definitivo.
     *
     * Lifetime → recorrente é bloqueado antes desta comparação.
     */
    if (
      currentInterval === BillingInterval.SEMESTERLY &&
      targetInterval === BillingInterval.YEARLY
    ) {
      return 1;
    }

    if (
      currentInterval === BillingInterval.YEARLY &&
      targetInterval === BillingInterval.SEMESTERLY
    ) {
      return -1;
    }

    if (
      currentInterval !== BillingInterval.LIFETIME &&
      targetInterval === BillingInterval.LIFETIME
    ) {
      return 1;
    }

    if (
      currentInterval === BillingInterval.LIFETIME &&
      targetInterval !== BillingInterval.LIFETIME
    ) {
      return -1;
    }

    return 0;
  }

  private normalizePrice(planPrice: PlanPriceEntity): number {
    switch (planPrice.interval) {
      case BillingInterval.SEMESTERLY:
        return planPrice.amount / 6;

      case BillingInterval.YEARLY:
        return planPrice.amount / 12;

      case BillingInterval.LIFETIME:
        /*
         * Lifetime não possui ciclo recorrente.
         * Mantemos seu valor integral como referência comercial
         * somente para o cálculo financeiro da prorrata.
         */
        return planPrice.amount;
    }
  }

  private calculateProratedAmount(
    currentPrice: PlanPriceEntity,
    targetPrice: PlanPriceEntity,
    subscription: SubscriptionEntity,
    referenceDate: Date,
  ): number {
    const totalPeriodMs =
      subscription.currentPeriodEnd.getTime() -
      subscription.currentPeriodStart.getTime();

    if (totalPeriodMs <= 0) {
      return 0;
    }

    const remainingPeriodMs = Math.max(
      0,
      subscription.currentPeriodEnd.getTime() -
        Math.max(
          referenceDate.getTime(),
          subscription.currentPeriodStart.getTime(),
        ),
    );

    if (remainingPeriodMs <= 0) {
      return 0;
    }

    /*
     * Lifetime é uma contratação única.
     * Ao migrar para Lifetime, aplicamos crédito proporcional
     * do ciclo atual sobre o valor integral da modalidade.
     */
    if (targetPrice.isLifetime) {
      const fraction = remainingPeriodMs / totalPeriodMs;
      const credit = currentPrice.amount * fraction;

      return Math.round(Math.max(0, targetPrice.amount - credit) * 100) / 100;
    }

    const currentMonthlyPrice = this.normalizePrice(currentPrice);
    const targetMonthlyPrice = this.normalizePrice(targetPrice);
    const priceDifference = targetMonthlyPrice - currentMonthlyPrice;

    if (priceDifference <= 0) {
      return 0;
    }

    const amount =
      priceDifference *
      12 *
      (remainingPeriodMs / (365.25 * 24 * 60 * 60 * 1000));

    return Math.round(amount * 100) / 100;
  }

  private async validateTargetCapacity(
    tenantId: string,
    targetPlan: PlanEntity,
  ): Promise<void> {
    const maxUsers = this.resolveMaxUsers(targetPlan);

    if (maxUsers === -1) {
      return;
    }

    const currentUsers =
      await this.tenantMemberRepository.countByTenant(tenantId);

    if (currentUsers > maxUsers) {
      throw new ConflictException(
        'O plano de destino não comporta a quantidade atual de membros do Tenant.',
      );
    }
  }

  private async validateCapacityReduction(
    tenantId: string,
    currentPlan: PlanEntity,
    targetPlan: PlanEntity,
  ): Promise<void> {
    const currentMaxUsers = this.resolveMaxUsers(currentPlan);
    const targetMaxUsers = this.resolveMaxUsers(targetPlan);

    const reducesCapacity =
      targetMaxUsers !== -1 &&
      (currentMaxUsers === -1 || targetMaxUsers < currentMaxUsers);

    if (!reducesCapacity) {
      return;
    }

    await this.validateTargetCapacity(tenantId, targetPlan);
  }

  private resolveMaxUsers(plan: PlanEntity): number {
    return plan.hasUnlimitedUsers ? -1 : plan.maxUsers;
  }

  private async notifySubscriptionChanged(
    subscription: SubscriptionEntity,
  ): Promise<void> {
    await this.createNotificationsForPermissionUseCase.execute({
      permissionCode: 'BILLING_MANAGE',
      type: NotificationType.SUBSCRIPTION_CHANGED,
      severity: NotificationSeverity.INFO,
      title: 'Assinatura alterada',
      message:
        'Uma assinatura teve seu plano ou sua modalidade comercial alterada ou sua alteração foi agendada.',
      resourceType: 'SUBSCRIPTION',
      resourceId: subscription.id,
      deduplicationKey: `SUBSCRIPTION_CHANGED:${subscription.id}:${subscription.updatedAt.getTime()}`,
    });
  }
}
