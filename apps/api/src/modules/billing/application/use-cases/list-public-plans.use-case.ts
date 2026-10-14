import { Injectable } from '@nestjs/common';

import { PublicPlanOutput } from '../dto/public-plan-output';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { PlanPriceRepository } from '../../domain/repositories/plan-price.repository';

/**
 * Caso de uso responsável por listar os planos comerciais
 * disponíveis para apresentação pública.
 *
 * O plano e suas modalidades comerciais são mantidos em
 * modelos de domínio separados. Por isso, o caso de uso
 * compõe a projeção pública a partir dos dois repositórios.
 */
@Injectable()
export class ListPublicPlansUseCase {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly planPriceRepository: PlanPriceRepository,
  ) {}

  /**
   * Retorna os planos públicos ativos juntamente com
   * todas as modalidades comerciais ativas de cada plano.
   *
   * O plano Trial pode ser retornado sem preços porque ele
   * representa a contratação inicial gratuita.
   */
  async execute(): Promise<PublicPlanOutput[]> {
    const plans = await this.planRepository.findPublicPlans();
    const outputs: PublicPlanOutput[] = [];

    for (const plan of plans) {
      const prices = await this.planPriceRepository.findActiveByPlan(plan.id);

      outputs.push({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        maxUsers: plan.maxUsers,
        active: plan.isActive,
        features: plan.features,
        prices: prices.map((price) => ({
          id: price.id,
          interval: price.interval,
          amount: price.amount,
          currency: price.currency,
        })),
      });
    }

    return outputs;
  }
}
