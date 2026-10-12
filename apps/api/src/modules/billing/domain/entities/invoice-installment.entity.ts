import { InvoiceInstallmentStatus } from '../enums/invoice-installment-status.enum';

/**
 * Representa uma parcela individual de uma Invoice.
 *
 * Responsabilidade:
 * - guardar valor e vencimento da parcela;
 * - controlar o estado financeiro individual;
 * - permitir que uma Invoice possua várias obrigações
 *   independentes de pagamento.
 */
export class InvoiceInstallmentEntity {
  constructor(
    public readonly id: string,
    public readonly invoiceId: string,
    public readonly number: number,
    public readonly totalCount: number,
    public readonly amount: number,
    public readonly currency: string,
    public readonly dueAt: Date,
    public status: InvoiceInstallmentStatus,
    public paidAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  get isPending(): boolean {
    return this.status === InvoiceInstallmentStatus.PENDING;
  }

  get isPaid(): boolean {
    return this.status === InvoiceInstallmentStatus.PAID;
  }

  get isOverdue(): boolean {
    return this.status === InvoiceInstallmentStatus.OVERDUE;
  }

  markAsPaid(paidAt: Date = new Date()): void {
    this.status = InvoiceInstallmentStatus.PAID;
    this.paidAt = paidAt;
    this.updatedAt = paidAt;
  }

  markAsOverdue(updatedAt: Date = new Date()): void {
    this.status = InvoiceInstallmentStatus.OVERDUE;
    this.updatedAt = updatedAt;
  }

  cancel(updatedAt: Date = new Date()): void {
    this.status = InvoiceInstallmentStatus.CANCELLED;
    this.paidAt = null;
    this.updatedAt = updatedAt;
  }
}
