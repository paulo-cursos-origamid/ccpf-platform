import { BillingInterval } from '../enums/billing-interval.enum';

/**
 * Representa uma modalidade comercial de um Plan.
 *
 * Um mesmo produto pode possuir preços semestrais,
 * anuais e vitalícios.
 */
export class PlanPriceEntity {
  constructor(
    public readonly id: string,
    public readonly planId: string,
    public interval: BillingInterval,
    public amount: number,
    public currency: string,
    public isActive: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  get isRecurring(): boolean {
    return this.interval !== BillingInterval.LIFETIME;
  }

  get isLifetime(): boolean {
    return this.interval === BillingInterval.LIFETIME;
  }
}
