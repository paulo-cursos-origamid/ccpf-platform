import { ForbiddenException, Injectable } from '@nestjs/common';

import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

import { SubscriptionLifecycleService } from '../services/subscription-lifecycle.service';

import { TenantRole } from '../../../tenant/domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../tenant/domain/repositories/tenant-member.repository';

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
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly subscriptionLifecycleService: SubscriptionLifecycleService,
    private readonly tenantMemberRepository: TenantMemberRepository,
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

    const subscription = await this.subscriptionLifecycleService.resolveCurrent(
      input.tenantId,
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

    return this.subscriptionRepository.update(subscription);
  }
}
