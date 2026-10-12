import { ForbiddenException, Injectable } from '@nestjs/common';

import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionLifecycleApplicationService } from '../services/subscription-lifecycle-application.service';

import { TenantRole } from '../../../tenant/domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../tenant/domain/repositories/tenant-member.repository';
import { BillingUnitOfWork } from '../../domain/repositories/billing-unit-of-work';

/**
 * Entrada necessária para cancelar a assinatura corrente
 * do Tenant.
 */
export interface CancelSubscriptionInput {
  tenantId: string;
  userId: string;
}

/**
 * Caso de uso responsável pelo cancelamento da assinatura.
 *
 * Responsabilidades:
 * - garantir que o usuário pertença ao Tenant;
 * - garantir que somente o OWNER possa cancelar;
 * - localizar a assinatura corrente;
 * - aplicar a transição de domínio para CANCELLED;
 * - persistir o novo estado da assinatura.
 */
@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionLifecycleApplicationService: SubscriptionLifecycleApplicationService,
    private readonly tenantMemberRepository: TenantMemberRepository,
    private readonly billingUnitOfWork: BillingUnitOfWork,
  ) {}

  async execute(input: CancelSubscriptionInput): Promise<SubscriptionEntity> {
    const currentMember = await this.tenantMemberRepository.findByTenantAndUser(
      input.tenantId,
      input.userId,
    );

    if (!currentMember) {
      throw new ForbiddenException(
        'O usuário não possui acesso a este Tenant.',
      );
    }

    if (currentMember.role !== TenantRole.OWNER) {
      throw new ForbiddenException(
        'Somente o OWNER pode cancelar a assinatura do Tenant.',
      );
    }

    return this.billingUnitOfWork.execute(async (context) => {
      const current = await context.subscriptionRepository.findCurrentByTenant(
        input.tenantId,
      );

      if (!current) {
        throw new ForbiddenException(
          'O Tenant não possui uma assinatura corrente para cancelar.',
        );
      }

      await context.lockSubscription(current.id);

      const subscription =
        await this.subscriptionLifecycleApplicationService.synchronize(
          input.tenantId,
          context,
        );

      if (!subscription) {
        throw new ForbiddenException(
          'O Tenant não possui uma assinatura corrente para cancelar.',
        );
      }

      /**
       * A entidade encapsula a transição para CANCELLED.
       * O caso de uso decide quando essa transição é permitida.
       */
      subscription.cancel();

      return context.subscriptionRepository.update(subscription);
    });
  }
}
