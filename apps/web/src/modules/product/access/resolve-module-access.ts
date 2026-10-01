/**
 * Resolve o estado de acesso de um módulo do produto.
 *
 * Responsabilidade:
 * - centralizar as regras de acesso dos módulos;
 * - separar regras comerciais da apresentação do Sidebar;
 * - considerar tenant, perfil administrativo, assinatura e features do plano.
 *
 * Esta camada NÃO renderiza componentes e NÃO decide como o Sidebar
 * deve apresentar cada estado.
 */

import type { TenantSubscriptionState } from "@/modules/billing";
import type {
  ProductModule,
  ProductModuleAccess,
} from "@/modules/product/catalog";

export interface ResolveModuleAccessContext {
  /**
   * Estado comercial da assinatura do tenant ativo.
   */
  subscription: TenantSubscriptionState;

  /**
   * Indica se existe um tenant ativo no contexto atual.
   */
  hasActiveTenant: boolean;

  /**
   * Indica se o usuário atual possui perfil de administrador da plataforma.
   */
  isPlatformAdmin: boolean;
}

/**
 * Resolve o acesso de um módulo considerando o contexto atual do usuário.
 */
export function resolveModuleAccess(
  module: ProductModule,
  context: ResolveModuleAccessContext,
): ProductModuleAccess {
  if (module.adminOnly && !context.isPlatformAdmin) {
    return "ADMIN_ONLY";
  }

  if (module.tenantRequired && !context.hasActiveTenant) {
    return "NO_TENANT";
  }

  /**
   * Módulos sem feature representam funcionalidades estruturais do produto.
   *
   * Eles não dependem diretamente da inclusão de uma feature comercial.
   * Isso também mantém Configurações/Faturamento acessíveis durante estados
   * como PENDING, permitindo que o usuário regularize a assinatura.
   */
  if (!module.feature) {
    return "AVAILABLE";
  }

  if (!context.subscription.hasCommercialAccess) {
    return "NO_COMMERCIAL_ACCESS";
  }

  const planFeatures = context.subscription.plan?.features ?? [];
  const featureIncluded = planFeatures.includes(module.feature);

  if (!featureIncluded) {
    return "NOT_INCLUDED";
  }

  if (!module.implemented) {
    return "COMING_SOON";
  }

  return "AVAILABLE";
}
