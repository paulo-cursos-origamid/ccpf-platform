/**
 * Estados possíveis de acesso a um módulo do produto.
 *
 * O estado comercial da assinatura é tratado separadamente.
 * Portanto, "NOT_INCLUDED" não significa necessariamente
 * assinatura inadimplente, e "COMING_SOON" não significa
 * que a feature não pertence ao plano.
 */

export type ProductModuleAccess =
  | "AVAILABLE"
  | "COMING_SOON"
  | "NOT_INCLUDED"
  | "NO_COMMERCIAL_ACCESS"
  | "ADMIN_ONLY"
  | "NO_TENANT";
