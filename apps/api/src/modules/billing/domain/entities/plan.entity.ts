import { BillingInterval } from '../enums/billing-interval.enum';
import { PlanFeatureCode } from '../enums/plan-feature-code.enum';

/**
 * Representa um plano comercial do CCPF.
 *
 * A entidade contém somente regras e dados pertencentes ao domínio
 * de Billing. Não possui dependência de Prisma ou infraestrutura.
 */
export class PlanEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public code: string,
    public description: string | null,
    public price: number,
    public currency: string,
    public billingInterval: BillingInterval,
    public maxUsers: number,
    public isPublic: boolean,
    public isActive: boolean,
    public features: PlanFeatureCode[],
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  /**
   * Indica se o plano possui limite ilimitado de usuários.
   *
   * O valor -1 é a representação persistida atualmente
   * para capacidade ilimitada.
   */
  get hasUnlimitedUsers(): boolean {
    return this.maxUsers === -1;
  }

  /**
   * Indica se o plano pode ser apresentado ao público.
   */
  get isAvailableForPublic(): boolean {
    return this.isPublic && this.isActive;
  }

  /**
   * Verifica se o plano possui determinada feature.
   */
  hasFeature(feature: PlanFeatureCode): boolean {
    return this.features.includes(feature);
  }
}
