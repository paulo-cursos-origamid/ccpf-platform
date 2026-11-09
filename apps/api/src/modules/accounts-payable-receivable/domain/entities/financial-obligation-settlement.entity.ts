import { randomUUID } from 'node:crypto';

/** Registro imutável de uma liquidação individual do compromisso. */
export interface FinancialObligationSettlementProps {
  id?: string;
  obligationId: string;
  tenantId: string;
  userId: string;
  accountId: string;
  principalAmount: string;
  interestAmount?: string;
  feeAmount?: string;
  discountAmount?: string;
  settledAt: Date;
  transactionId?: string | null;
  createdAt?: Date;
}

export class FinancialObligationSettlementEntity {
  readonly id: string;
  readonly obligationId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly accountId: string;
  readonly principalAmount: string;
  readonly interestAmount: string;
  readonly feeAmount: string;
  readonly discountAmount: string;
  readonly settledAmount: string;
  readonly settledAt: Date;
  readonly createdAt: Date;
  private _transactionId: string | null;

  constructor(props: FinancialObligationSettlementProps) {
    if (
      !props.obligationId.trim() ||
      !props.tenantId.trim() ||
      !props.userId.trim() ||
      !props.accountId.trim()
    ) {
      throw new Error('Settlement references are required');
    }

    if (
      props.transactionId !== undefined &&
      props.transactionId !== null &&
      !props.transactionId.trim()
    ) {
      throw new Error('Settlement transaction reference is invalid');
    }

    this.id = props.id ?? randomUUID();
    this.obligationId = props.obligationId;
    this.tenantId = props.tenantId;
    this.userId = props.userId;
    this.accountId = props.accountId;
    this.principalAmount = this.normalize(props.principalAmount);
    this.interestAmount = this.normalize(props.interestAmount ?? '0');
    this.feeAmount = this.normalize(props.feeAmount ?? '0');
    this.discountAmount = this.normalize(props.discountAmount ?? '0');

    const principalCents = this.cents(this.principalAmount);
    const discountCents = this.cents(this.discountAmount);

    if (principalCents <= 0n) {
      throw new Error('Settlement must reduce the outstanding obligation');
    }

    if (discountCents > principalCents) {
      throw new Error('Discount cannot exceed the amortized principal');
    }

    this.settledAmount = this.format(
      principalCents -
        discountCents +
        this.cents(this.interestAmount) +
        this.cents(this.feeAmount),
    );
    this.settledAt = props.settledAt;
    this.createdAt = props.createdAt ?? new Date();
    this._transactionId = props.transactionId ?? null;

    if (Number.isNaN(this.settledAt.getTime())) {
      throw new Error('Settlement date is invalid');
    }
  }

  get transactionId(): string | null {
    return this._transactionId;
  }

  linkTransaction(transactionId: string): void {
    if (this._transactionId || !transactionId.trim()) {
      throw new Error('A transaction can only be linked once to a settlement');
    }
    this._transactionId = transactionId;
  }

  toJSON(): FinancialObligationSettlementProps & { settledAmount: string } {
    return {
      id: this.id,
      obligationId: this.obligationId,
      tenantId: this.tenantId,
      userId: this.userId,
      accountId: this.accountId,
      principalAmount: this.principalAmount,
      interestAmount: this.interestAmount,
      feeAmount: this.feeAmount,
      discountAmount: this.discountAmount,
      settledAmount: this.settledAmount,
      settledAt: this.settledAt,
      transactionId: this.transactionId,
      createdAt: this.createdAt,
    };
  }

  private normalize(value: string): string {
    const normalized = value.trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
      throw new Error('Settlement amounts must be zero or positive values');
    }
    const [whole, fraction = ''] = normalized.split('.');
    if (whole.length > 10) {
      throw new Error('Settlement amount is outside the supported range');
    }
    return `${whole}.${fraction.padEnd(2, '0')}`;
  }

  private cents(value: string): bigint {
    const [whole, fraction] = value.split('.');
    return BigInt(whole) * 100n + BigInt(fraction);
  }

  private format(value: bigint): string {
    return `${value / 100n}.${(value % 100n).toString().padStart(2, '0')}`;
  }
}
