import { Injectable } from '@nestjs/common';

import { PlanEntity } from '../../domain/entities/plan.entity';
import { PlanRepository } from '../../domain/repositories/plan.repository';

/**
 * Caso de uso responsável por listar os planos comerciais
 * disponíveis para apresentação pública.
 *
 * A consulta é delegada ao repositório de domínio, que garante
 * que somente planos públicos e ativos sejam retornados.
 */
@Injectable()
export class ListPublicPlansUseCase {
  constructor(private readonly planRepository: PlanRepository) {}

  /**
   * Retorna os planos comerciais disponíveis publicamente.
   */
  async execute(): Promise<PlanEntity[]> {
    return this.planRepository.findPublicPlans();
  }
}
