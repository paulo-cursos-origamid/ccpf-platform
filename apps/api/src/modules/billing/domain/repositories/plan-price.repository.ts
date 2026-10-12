import { PlanPriceEntity } from '../entities/plan-price.entity';
import { BillingInterval } from '../enums/billing-interval.enum';

export abstract class PlanPriceRepository {
  abstract create(planPrice: PlanPriceEntity): Promise<PlanPriceEntity>;

  abstract findById(id: string): Promise<PlanPriceEntity | null>;

  abstract findByPlanAndInterval(
    planId: string,
    interval: BillingInterval,
  ): Promise<PlanPriceEntity | null>;

  abstract findActiveByPlan(planId: string): Promise<PlanPriceEntity[]>;

  abstract update(planPrice: PlanPriceEntity): Promise<PlanPriceEntity>;
}
