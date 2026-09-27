import { SetMetadata } from '@nestjs/common';

import { PlanFeatureCode } from '../../domain/enums/plan-feature-code.enum';

/**
 * Metadata utilizada pelo PlanFeatureGuard para identificar
 * a feature comercial exigida por um endpoint.
 */
export const REQUIRED_PLAN_FEATURE_KEY = 'required_plan_feature';

/**
 * Exige que o Tenant possua determinada feature em seu plano.
 *
 * Exemplo:
 *
 * @RequireFeature(PlanFeatureCode.VEHICLES)
 */
export const RequireFeature = (feature: PlanFeatureCode) =>
  SetMetadata(REQUIRED_PLAN_FEATURE_KEY, feature);
