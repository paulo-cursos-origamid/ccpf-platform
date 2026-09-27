import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

/**
 * Representa uma tentativa de pagamento de uma Invoice.
 *
 * A entidade é independente do provedor utilizado para efetivar
 * ou confirmar o pagamento.
 *
 * Hoje o CCPF poderá trabalhar manualmente com PIX e boleto.
 * Futuramente a mesma entidade poderá receber dados de um gateway
 * sem precisar mudar o conceito de domínio.
 */
export class PaymentEntity {
  constructor(
    public readonly id: string,
    public readonly invoiceId: string,
    public readonly reference: string,
    public readonly method: PaymentMethod,
    public status: PaymentStatus,
    public readonly amount: number,
    public readonly currency: string,
    public paidAt: Date | null,
    public readonly expiresAt: Date | null,
    public readonly provider: string | null,
    public readonly providerPaymentId: string | null,
    public readonly externalReference: string | null,
    public readonly pixCopyPaste: string | null,
    public readonly bankSlipBarcode: string | null,
    public readonly bankSlipDigitableLine: string | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  /**
   * Indica se o pagamento está pendente.
   */
  get isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  /**
   * Indica se o pagamento está em processamento.
   */
  get isProcessing(): boolean {
    return this.status === PaymentStatus.PROCESSING;
  }

  /**
   * Indica se o pagamento foi confirmado.
   */
  get isPaid(): boolean {
    return this.status === PaymentStatus.PAID;
  }

  /**
   * Indica se o pagamento falhou.
   */
  get isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  /**
   * Indica se o pagamento foi estornado.
   */
  get isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED;
  }

  /**
   * Indica se o pagamento foi cancelado.
   */
  get isCancelled(): boolean {
    return this.status === PaymentStatus.CANCELLED;
  }

  /**
   * Coloca o pagamento em processamento.
   *
   * Útil para uma futura confirmação assíncrona por gateway.
   */
  markAsProcessing(updatedAt: Date = new Date()): void {
    this.status = PaymentStatus.PROCESSING;
    this.updatedAt = updatedAt;
  }

  /**
   * Marca o pagamento como confirmado.
   */
  markAsPaid(paidAt: Date = new Date()): void {
    this.status = PaymentStatus.PAID;
    this.paidAt = paidAt;
    this.updatedAt = paidAt;
  }

  /**
   * Marca o pagamento como falho.
   */
  markAsFailed(updatedAt: Date = new Date()): void {
    this.status = PaymentStatus.FAILED;
    this.paidAt = null;
    this.updatedAt = updatedAt;
  }

  /**
   * Cancela a tentativa de pagamento.
   */
  cancel(updatedAt: Date = new Date()): void {
    this.status = PaymentStatus.CANCELLED;
    this.paidAt = null;
    this.updatedAt = updatedAt;
  }

  /**
   * Marca um pagamento confirmado como estornado.
   *
   * O paidAt é preservado como histórico da confirmação original.
   */
  refund(updatedAt: Date = new Date()): void {
    this.status = PaymentStatus.REFUNDED;
    this.updatedAt = updatedAt;
  }
}
