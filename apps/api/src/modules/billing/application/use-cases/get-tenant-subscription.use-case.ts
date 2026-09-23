import { Injectable } from '@nestjs/common';

import { SubscriptionLifecycleService } from '../services/subscription-lifecycle.service';
import { SubscriptionEntity } from '../../domain/entities/subscription.entity';

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
    private readonly subscriptionLifecycleService: SubscriptionLifecycleService,
  ) {}

  /**
   * Retorna a assinatura vigente do Tenant.
   *
   * Caso o Tenant ainda não possua uma assinatura vigente,
   * retorna null.
   */
  async execute(tenantId: string): Promise<SubscriptionEntity | null> {
    return this.subscriptionLifecycleService.resolveCurrent(tenantId);
  }
}
