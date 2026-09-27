import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

/**
 * Dados necessários para ativar uma assinatura.
 *
 * A operação é administrativa e atua diretamente sobre
 * a assinatura identificada pelo seu ID.
 */
export interface ActivateSubscriptionInput {
  subscriptionId: string;
}

/**
 * Caso de uso responsável pela confirmação administrativa
 * de uma assinatura que está aguardando pagamento.
 *
 * Responsabilidades:
 * - localizar a assinatura;
 * - garantir que ela esteja em PENDING;
 * - aplicar a transição PENDING -> ACTIVE;
 * - persistir o novo estado.
 *
 * A autorização de plataforma é responsabilidade da camada
 * de apresentação através da permissão BILLING_MANAGE.
 */
@Injectable()
export class ActivateSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(input: ActivateSubscriptionInput): Promise<SubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findById(
      input.subscriptionId,
    );

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada.');
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('A assinatura já está ativa.');
    }

    if (subscription.status !== SubscriptionStatus.PENDING) {
      throw new BadRequestException(
        'Somente assinaturas PENDING podem ser ativadas.',
      );
    }

    /**
     * A entidade encapsula a transição de estado.
     */
    subscription.activate();

    return this.subscriptionRepository.update(subscription);
  }
}
