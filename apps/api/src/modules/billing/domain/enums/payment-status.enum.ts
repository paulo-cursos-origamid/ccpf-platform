/**
 * Estados possíveis de uma tentativa de pagamento.
 *
 * PENDING:
 * Tentativa criada e aguardando pagamento.
 *
 * PROCESSING:
 * Pagamento em processamento.
 *
 * PAID:
 * Pagamento confirmado.
 *
 * FAILED:
 * Tentativa não concluída com sucesso.
 *
 * REFUNDED:
 * Pagamento anteriormente confirmado e posteriormente devolvido.
 *
 * CANCELLED:
 * Tentativa cancelada sem conclusão.
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}
