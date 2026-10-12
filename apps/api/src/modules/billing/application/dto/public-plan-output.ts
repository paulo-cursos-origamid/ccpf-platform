import { BillingInterval } from '../../domain/enums/billing-interval.enum';
import { PlanFeatureCode } from '../../domain/enums/plan-feature-code.enum';

/**
 * Representa uma modalidade comercial publicada junto
 * ao plano na consulta pública de Billing.
 *
 * O preço permanece separado do PlanEntity porque representa
 * uma condição comercial, e não uma característica estrutural
 * do produto.
 */
export interface PublicPlanPriceOutput {
  id: string;
  interval: BillingInterval;
  amount: number;
  currency: string;
}

/**
 * Projeção pública de um plano comercial.
 *
 * Esta saída não expõe diretamente a entidade de domínio.
 * Os preços ativos são compostos pelo caso de uso a partir
 * do PlanRepository e do PlanPriceRepository.
 */
export interface PublicPlanOutput {
  id: string;
  code: string;
  name: string;
  description: string | null;
  maxUsers: number;
  active: boolean;
  features: PlanFeatureCode[];
  prices: PublicPlanPriceOutput[];
}
