/**
 * Estados possíveis de uma parcela de Invoice.
 *
 * A parcela possui ciclo financeiro próprio, independente
 * do estado consolidado da Invoice.
 */
export enum InvoiceInstallmentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}
