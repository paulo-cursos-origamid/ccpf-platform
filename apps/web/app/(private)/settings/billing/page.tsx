// import { BillingSettings } from "@/modules/billing/components";

import { BillingSettings } from "@/modules/billing/components/BillingSettings";

/**
 * Página de gerenciamento do plano e da assinatura
 * do Tenant atualmente selecionado.
 *
 * A rota pertence ao contexto de Settings.
 * A apresentação e as regras específicas do Billing
 * permanecem encapsuladas no módulo Billing.
 */
export default function BillingSettingsPage() {
  return <BillingSettings />;
}
