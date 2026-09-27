import { InvoiceStatus } from '../enums/invoice-status.enum';

/**
 * Representa uma fatura comercial emitida pelo CCPF
 * para um Tenant.
 *
 * A Invoice representa a obrigação financeira do cliente.
 * Ela não representa a forma utilizada para quitar essa obrigação.
 *
 * A tentativa/meio de pagamento pertence à PaymentEntity.
 */
export class InvoiceEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly subscriptionId: string,
    public readonly number: string,
    public status: InvoiceStatus,
    public readonly amount: number,
    public readonly currency: string,
    public readonly dueAt: Date,
    public paidAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  /**
   * Indica se a fatura está pendente.
   */
  get isPending(): boolean {
    return this.status === InvoiceStatus.PENDING;
  }

  /**
   * Indica se a fatura foi paga.
   */
  get isPaid(): boolean {
    return this.status === InvoiceStatus.PAID;
  }

  /**
   * Indica se a fatura está vencida.
   */
  get isOverdue(): boolean {
    return this.status === InvoiceStatus.OVERDUE;
  }

  /**
   * Indica se a fatura foi cancelada.
   */
  get isCancelled(): boolean {
    return this.status === InvoiceStatus.CANCELLED;
  }

  /**
   * Marca a fatura como paga.
   */
  markAsPaid(paidAt: Date = new Date()): void {
    this.status = InvoiceStatus.PAID;
    this.paidAt = paidAt;
    this.updatedAt = paidAt;
  }

  /**
   * Marca a fatura como vencida.
   */
  markAsOverdue(updatedAt: Date = new Date()): void {
    this.status = InvoiceStatus.OVERDUE;
    this.updatedAt = updatedAt;
  }

  /**
   * Cancela a fatura.
   */
  cancel(updatedAt: Date = new Date()): void {
    this.status = InvoiceStatus.CANCELLED;
    this.paidAt = null;
    this.updatedAt = updatedAt;
  }
}
