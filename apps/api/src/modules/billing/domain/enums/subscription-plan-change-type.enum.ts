/**
 * Tipo de alteração comercial pendente da assinatura.
 *
 * UPGRADE:
 *   A alteração depende do pagamento de uma Invoice de prorrata.
 *
 * DOWNGRADE:
 *   A alteração fica agendada para o encerramento do ciclo atual.
 */
export enum SubscriptionPlanChangeType {
  UPGRADE = 'UPGRADE',
  DOWNGRADE = 'DOWNGRADE',
}
