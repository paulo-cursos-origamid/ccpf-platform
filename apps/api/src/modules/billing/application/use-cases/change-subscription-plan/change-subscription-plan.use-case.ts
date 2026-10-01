import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PlanEntity } from '../../../domain/entities/plan.entity';
import { SubscriptionEntity } from '../../../domain/entities/subscription.entity';
import { BillingInterval } from '../../../domain/enums/billing-interval.enum';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum';
import { TenantRole } from '../../../../tenant/domain/enums/tenant-role.enum';
import { PlanRepository } from '../../../domain/repositories/plan.repository';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { CreateInvoiceUseCase } from '../invoice/create-invoice.use-case';
import { SubscriptionLifecycleService } from '../../services/subscription-lifecycle.service';

export interface ChangeSubscriptionPlanInput {
  tenantId: string;
  userId: string;
  planCode: string;
}

@Injectable()
export class ChangeSubscriptionPlanUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly subscriptionLifecycleService: SubscriptionLifecycleService,
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
  ) {}

  async execute(
    input: ChangeSubscriptionPlanInput,
  ): Promise<SubscriptionEntity> {
    const tenantMember = await this.tenantMemberRepository.findByTenantAndUser(
      input.tenantId,
      input.userId,
    );

    if (!tenantMember || tenantMember.role !== TenantRole.OWNER) {
      throw new ForbiddenException(
        'Apenas o OWNER do Tenant pode alterar o plano da assinatura.',
      );
    }

    const subscription = await this.subscriptionLifecycleService.resolveCurrent(
      input.tenantId,
    );

    if (!subscription) {
      throw new NotFoundException(
        'Nenhuma assinatura ativa foi encontrada para o Tenant.',
      );
    }

    if (subscription.hasPendingPlanChange) {
      throw new ConflictException(
        'A assinatura já possui uma alteração de plano pendente.',
      );
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIALING
    ) {
      throw new BadRequestException(
        'A assinatura atual não permite alteração de plano.',
      );
    }

    const currentPlan = await this.planRepository.findById(subscription.planId);

    if (!currentPlan) {
      throw new NotFoundException('Plano atual da assinatura não encontrado.');
    }

    const targetPlan = await this.planRepository.findByCode(input.planCode);

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

    if (targetPlan.id === currentPlan.id) {
      throw new ConflictException(
        'A assinatura já está vinculada ao plano informado.',
      );
    }

    const now = new Date();

    /*
     * Trial continua seguindo o fluxo de contratação integral:
     * o plano informado passa a ser o plano da assinatura PENDING
     * e uma Invoice integral é criada.
     */
    if (subscription.status === SubscriptionStatus.TRIALING) {
      await this.validateTargetCapacity(input.tenantId, targetPlan);

      subscription.changePlan(targetPlan.id, now);
      subscription.markAsPending(now);

      return this.persistTrialChange(subscription);
    }

    /*
     * Downgrades que reduzam capacidade precisam ser validados
     * antes de serem agendados.
     */
    await this.validateCapacityReduction(
      input.tenantId,
      currentPlan,
      targetPlan,
    );

    const priceComparison = this.comparePlanPrices(currentPlan, targetPlan);

    /*
     * Preço menor:
     * mantém o plano atual durante o ciclo já pago e agenda
     * a troca para o início do próximo ciclo.
     */
    if (priceComparison < 0) {
      return this.scheduleDowngrade(subscription, targetPlan, now);
    }

    /*
     * Preço maior:
     * gera uma Invoice proporcional ao período restante.
     * O plano atual continua efetivo até a confirmação do pagamento.
     */
    if (priceComparison > 0) {
      return this.scheduleUpgrade(subscription, currentPlan, targetPlan, now);
    }

    /*
     * Mesmo preço:
     * aumento de capacidade pode ser aplicado imediatamente;
     * redução de capacidade continua sendo tratada como downgrade.
     */
    const currentCapacity = this.resolveMaxUsers(currentPlan);
    const targetCapacity = this.resolveMaxUsers(targetPlan);

    if (targetCapacity > currentCapacity) {
      subscription.changePlan(targetPlan.id, now);

      return this.subscriptionRepository.update(subscription);
    }

    if (targetCapacity < currentCapacity) {
      return this.scheduleDowngrade(subscription, targetPlan, now);
    }

    throw new BadRequestException(
      'O plano de destino não representa uma alteração comercial válida.',
    );
  }

  private async persistTrialChange(
    subscription: SubscriptionEntity,
  ): Promise<SubscriptionEntity> {
    const updatedSubscription =
      await this.subscriptionRepository.update(subscription);

    await this.createInvoiceUseCase.execute({
      subscriptionId: updatedSubscription.id,
    });

    return updatedSubscription;
  }

  private async scheduleUpgrade(
    subscription: SubscriptionEntity,
    currentPlan: PlanEntity,
    targetPlan: PlanEntity,
    referenceDate: Date,
  ): Promise<SubscriptionEntity> {
    const amount = this.calculateProratedAmount(
      currentPlan,
      targetPlan,
      subscription,
      referenceDate,
    );

    /*
     * Proteção para ciclos já encerrados ou valores sem cobrança.
     * Nesse cenário não existe obrigação financeira a aguardar.
     */
    if (amount <= 0) {
      subscription.changePlan(targetPlan.id, referenceDate);

      return this.subscriptionRepository.update(subscription);
    }

    const invoice = await this.createInvoiceUseCase.execute({
      subscriptionId: subscription.id,
      amount,
    });

    subscription.scheduleUpgrade(
      targetPlan.id,
      invoice.id,
      referenceDate,
      referenceDate,
    );

    return this.subscriptionRepository.update(subscription);
  }

  private async scheduleDowngrade(
    subscription: SubscriptionEntity,
    targetPlan: PlanEntity,
    referenceDate: Date,
  ): Promise<SubscriptionEntity> {
    const effectiveAt =
      subscription.currentPeriodEnd.getTime() > referenceDate.getTime()
        ? subscription.currentPeriodEnd
        : referenceDate;

    subscription.scheduleDowngrade(targetPlan.id, effectiveAt, referenceDate);

    return this.subscriptionRepository.update(subscription);
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

  /**
   * Compara os preços na mesma unidade comercial.
   *
   * Atualmente os planos são mensais, mas a normalização permite
   * comparar corretamente planos mensais e anuais caso essa
   * combinação seja disponibilizada futuramente.
   */
  private comparePlanPrices(
    currentPlan: PlanEntity,
    targetPlan: PlanEntity,
  ): number {
    const targetComparablePrice = this.normalizePrice(
      targetPlan,
      currentPlan.billingInterval,
    );

    const currentComparablePrice = this.normalizePrice(
      currentPlan,
      currentPlan.billingInterval,
    );

    if (targetComparablePrice > currentComparablePrice) {
      return 1;
    }

    if (targetComparablePrice < currentComparablePrice) {
      return -1;
    }

    return 0;
  }

  private normalizePrice(
    plan: PlanEntity,
    referenceInterval: BillingInterval,
  ): number {
    if (plan.billingInterval === referenceInterval) {
      return plan.price;
    }

    if (
      referenceInterval === BillingInterval.MONTHLY &&
      plan.billingInterval === BillingInterval.YEARLY
    ) {
      return plan.price / 12;
    }

    if (
      referenceInterval === BillingInterval.YEARLY &&
      plan.billingInterval === BillingInterval.MONTHLY
    ) {
      return plan.price * 12;
    }

    return plan.price;
  }

  /**
   * Calcula a cobrança proporcional ao período restante.
   *
   * Exemplo:
   * - plano atual: R$ 19,90;
   * - plano destino: R$ 39,90;
   * - metade do ciclo restante;
   * - cobrança aproximada: R$ 10,00.
   */
  private calculateProratedAmount(
    currentPlan: PlanEntity,
    targetPlan: PlanEntity,
    subscription: SubscriptionEntity,
    referenceDate: Date,
  ): number {
    const currentPrice = this.normalizePrice(
      currentPlan,
      currentPlan.billingInterval,
    );

    const targetPrice = this.normalizePrice(
      targetPlan,
      currentPlan.billingInterval,
    );

    const priceDifference = targetPrice - currentPrice;

    if (priceDifference <= 0) {
      return 0;
    }

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

    const amount = (priceDifference * remainingPeriodMs) / totalPeriodMs;

    return Math.round(amount * 100) / 100;
  }
}
