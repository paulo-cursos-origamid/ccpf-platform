import { PlanFeatureCode } from '../enums/plan-feature-code.enum';

/**
 * Representa o produto comercial do CCPF.
 *
 * O Plan define o produto e suas capacidades.
 * Preço e periodicidade pertencem a PlanPrice.
 */
export class PlanEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public code: string,
    public description: string | null,
    public maxUsers: number,
    public isPublic: boolean,
    public isActive: boolean,
    public features: PlanFeatureCode[],
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  get hasUnlimitedUsers(): boolean {
    return this.maxUsers === -1;
  }

  get isAvailableForPublic(): boolean {
    return this.isPublic && this.isActive;
  }

  hasFeature(feature: PlanFeatureCode): boolean {
    return this.features.includes(feature);
  }
}
