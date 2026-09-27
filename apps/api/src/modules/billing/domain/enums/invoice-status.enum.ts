/**
 * Estados possíveis de uma Invoice.
 *
 * PENDING:
 * Fatura emitida e ainda não quitada.
 *
 * PAID:
 * Fatura quitada.
 *
 * OVERDUE:
 * Fatura vencida sem pagamento confirmado.
 *
 * CANCELLED:
 * Fatura cancelada e sem obrigação de pagamento.
 */
export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}
