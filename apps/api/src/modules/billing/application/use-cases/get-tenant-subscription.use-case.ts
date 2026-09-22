import { Injectable } from '@nestjs/common';

import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

/**
 * Caso de uso responsável por consultar a assinatura vigente
 * de um Tenant.
 *
 * O Tenant é recebido como contexto da aplicação.
 * A resolução e validação desse contexto pertencem à camada
 * de apresentação através do TenantContextGuard.
 */
@Injectable()
export class GetTenantSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  /**
   * Retorna a assinatura vigente do Tenant.
   *
   * Caso o Tenant ainda não possua uma assinatura vigente,
   * retorna null.
   */
  async execute(tenantId: string): Promise<SubscriptionEntity | null> {
    return this.subscriptionRepository.findActiveByTenant(tenantId);
  }
}
