import { PlanEntity } from '../entities/plan.entity';

export abstract class PlanRepository {
  abstract create(plan: PlanEntity): Promise<PlanEntity>;

  abstract findById(id: string): Promise<PlanEntity | null>;

  abstract findByCode(code: string): Promise<PlanEntity | null>;

  abstract findPublicPlans(): Promise<PlanEntity[]>;

  abstract update(plan: PlanEntity): Promise<PlanEntity>;
}
