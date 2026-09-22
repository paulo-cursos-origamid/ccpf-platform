/**
 * Estados possíveis de uma assinatura.
 *
 * PENDING:
 * Assinatura de plano pago criada e aguardando confirmação
 * do pagamento.
 *
 * TRIALING:
 * Tenant utilizando o período de avaliação gratuita.
 */
export enum SubscriptionStatus {
  PENDING = 'PENDING',
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}
