import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TenantMemberStatus } from '../../../../tenant/domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../../tenant/domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';

import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum';
import { PlanRepository } from '../../../domain/repositories/plan.repository';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { SubscriptionEntity } from '../../../domain/entities/subscription.entity';
import { SubscriptionLifecycleService } from '../../services/subscription-lifecycle.service';

/**
 * Dados necessários para alterar o plano da assinatura.
 */
export interface ChangeSubscriptionPlanInput {
  tenantId: string;
  userId: string;
  planCode: string;
}

/**
 * Caso de uso responsável pela alteração do plano da assinatura corrente.
 *
 * Regras:
 * - somente OWNER pode alterar o plano;
 * - deve existir uma assinatura corrente;
 * - somente ACTIVE e TRIALING válido podem ser alterados;
 * - o plano destino deve existir, estar ativo e público;
 * - ACTIVE pode trocar imediatamente de plano;
 * - TRIALING pode converter para um plano pago;
 * - conversão de Trial para plano pago entra em PENDING;
 * - troca para o mesmo plano é rejeitada;
 * - redução de capacidade nunca pode deixar o Tenant acima
 *   do limite do plano destino;
 * - o plano TRIAL é reservado para contratação inicial.
 */
@Injectable()
export class ChangeSubscriptionPlanUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly subscriptionLifecycleService: SubscriptionLifecycleService,
  ) {}

  async execute(
    input: ChangeSubscriptionPlanInput,
  ): Promise<SubscriptionEntity> {
    const currentMember = await this.tenantMemberRepository.findByTenantAndUser(
      input.tenantId,
      input.userId,
    );

    if (!currentMember) {
      throw new ForbiddenException('User does not belong to this Tenant');
    }

    if (currentMember.status !== TenantMemberStatus.ACTIVE) {
      throw new ForbiddenException('User access to this Tenant is not active');
    }

    if (currentMember.role !== TenantRole.OWNER) {
      throw new ForbiddenException(
        'Only the Tenant OWNER can change the subscription plan',
      );
    }

    const subscription = await this.subscriptionLifecycleService.resolveCurrent(
      input.tenantId,
    );

    if (!subscription) {
      throw new BadRequestException(
        'O Tenant não possui uma assinatura vigente.',
      );
    }

    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIALING
    ) {
      throw new BadRequestException(
        'A assinatura atual não pode ter o plano alterado neste estado.',
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

    if (!targetPlan.isActive) {
      throw new BadRequestException('O plano de destino não está ativo.');
    }

    if (!targetPlan.isPublic) {
      throw new BadRequestException(
        'O plano de destino não está disponível para contratação.',
      );
    }

    if (targetPlan.id === currentPlan.id) {
      throw new ConflictException(
        'O Tenant já possui este plano em sua assinatura.',
      );
    }

    /**
     * O Trial é uma condição inicial do Tenant e não deve
     * ser utilizado como plano de destino de uma assinatura
     * já existente.
     */
    if (targetPlan.code === 'TRIAL') {
      throw new BadRequestException(
        'O plano TRIAL está disponível somente para contratação inicial.',
      );
    }

    /**
     * Qualquer mudança que reduza a capacidade máxima
     * precisa respeitar a quantidade de membros que atualmente
     * ocupam vagas.
     *
     * A contagem inclui ACTIVE, INVITED e BLOCKED.
     * REMOVED não ocupa vaga.
     */
    const reducesCapacity =
      targetPlan.hasUnlimitedUsers || currentPlan.maxUsers === -1
        ? targetPlan.maxUsers !== -1 && currentPlan.maxUsers === -1
        : targetPlan.maxUsers < currentPlan.maxUsers;

    /**
     * Uma redução de preço também representa um downgrade
     * comercial, mesmo quando a capacidade não diminui.
     */
    const isCommercialDowngrade = targetPlan.price < currentPlan.price;

    if (reducesCapacity || isCommercialDowngrade) {
      await this.validateTargetCapacity(input.tenantId, targetPlan.maxUsers);
    }

    const now = new Date();

    subscription.changePlan(targetPlan.id, now);

    /**
     * Um Tenant em Trial que escolhe um plano pago
     * precisa aguardar a confirmação do pagamento antes
     * de receber acesso comercial ao plano contratado.
     */
    if (
      subscription.status === SubscriptionStatus.TRIALING &&
      targetPlan.code !== 'TRIAL'
    ) {
      subscription.markAsPending(now);
    }

    return this.subscriptionRepository.update(subscription);
  }

  /**
   * Verifica se o Tenant já possui membros acima
   * do limite permitido pelo plano de destino.
   *
   * -1 representa capacidade ilimitada.
   */
  private async validateTargetCapacity(
    tenantId: string,
    maxUsers: number,
  ): Promise<void> {
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
}
