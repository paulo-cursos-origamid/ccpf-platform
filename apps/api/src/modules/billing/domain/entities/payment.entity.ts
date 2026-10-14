import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

export class PaymentEntity {
  constructor(
    public readonly id: string,
    public readonly installmentId: string,
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
    public cancellationReason: string | null = null,
  ) {}

  get isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  get isPaid(): boolean {
    return this.status === PaymentStatus.PAID;
  }

  markAsPaid(paidAt: Date = new Date()): void {
    this.status = PaymentStatus.PAID;
    this.paidAt = paidAt;
    this.updatedAt = paidAt;
  }

  markAsFailed(updatedAt: Date = new Date()): void {
    this.status = PaymentStatus.FAILED;
    this.updatedAt = updatedAt;
  }

  cancel(reason: string, updatedAt: Date = new Date()): void {
    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      throw new Error('O motivo do cancelamento é obrigatório.');
    }

    this.status = PaymentStatus.CANCELLED;
    this.cancellationReason = normalizedReason;
    this.updatedAt = updatedAt;
  }
}
