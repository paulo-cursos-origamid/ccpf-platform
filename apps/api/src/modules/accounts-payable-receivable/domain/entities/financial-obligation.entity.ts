import { randomUUID } from 'node:crypto';
import { FinancialObligationStatus } from '../enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../enums/financial-obligation-type.enum';
import { FinancialObligationSourceType } from '../enums/financial-obligation-source-type.enum';
import { FinancialObligationSettlementEntity } from './financial-obligation-settlement.entity';

/** Propriedades públicas usadas para reconstruir e serializar um compromisso. */
export interface FinancialObligationProps {
  id?: string;
  tenantId: string;
  userId: string;
  accountId: string;
  categoryId: string;
  subCategoryId?: string | null;
  transactionId?: string | null;
  sourceType?: FinancialObligationSourceType;
  sourceId?: string | null;
  type: FinancialObligationType;
  status?: FinancialObligationStatus;
  title: string;
  counterparty?: string | null;
  amount: string;
  dueDate: Date;
  settledAt?: Date | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  settlements?: FinancialObligationSettlementEntity[];
}

/** Regras de estado e validações independentes de HTTP e persistência. */
export class FinancialObligationEntity {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _userId: string;
  private _accountId: string;
  private _categoryId: string;
  private _subCategoryId: string | null;
  private _transactionId: string | null;
  private readonly _sourceType: FinancialObligationSourceType;
  private readonly _sourceId: string | null;
  private _type: FinancialObligationType;
  private _status: FinancialObligationStatus;
  private _title: string;
  private _counterparty: string | null;
  private _amount: string;
  private _dueDate: Date;
  private _settledAt: Date | null;
  private _description: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _settlements: FinancialObligationSettlementEntity[];

  constructor(props: FinancialObligationProps) {
    this._id = props.id ?? randomUUID();
    this._tenantId = props.tenantId;
    this._userId = props.userId;
    this._accountId = props.accountId;
    this._categoryId = props.categoryId;
    this._subCategoryId = props.subCategoryId ?? null;
    this._transactionId = props.transactionId ?? null;
    this._sourceType = props.sourceType ?? FinancialObligationSourceType.MANUAL;
    this._sourceId = props.sourceId?.trim() || null;
    this.validateSource();
    this._type = props.type;
    this._status = props.status ?? FinancialObligationStatus.PENDING;
    this._title = this.validateTitle(props.title);
    this._counterparty = props.counterparty?.trim() || null;
    this._amount = this.normalizeAmount(props.amount);
    this._dueDate = this.validateDate(props.dueDate, 'Due date is invalid');
    this._settledAt = props.settledAt ?? null;
    this._description = props.description?.trim() || null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this._settlements = [...(props.settlements ?? [])];
  }

  get id(): string {
    return this._id;
  }
  get tenantId(): string {
    return this._tenantId;
  }
  get userId(): string {
    return this._userId;
  }
  get accountId(): string {
    return this._accountId;
  }
  get categoryId(): string {
    return this._categoryId;
  }
  get subCategoryId(): string | null {
    return this._subCategoryId;
  }
  get transactionId(): string | null {
    return this._transactionId;
  }
  get sourceType(): FinancialObligationSourceType {
    return this._sourceType;
  }
  get sourceId(): string | null {
    return this._sourceId;
  }
  get type(): FinancialObligationType {
    return this._type;
  }
  get status(): FinancialObligationStatus {
    return this._status;
  }
  get title(): string {
    return this._title;
  }
  get counterparty(): string | null {
    return this._counterparty;
  }
  get amount(): string {
    return this._amount;
  }
  get dueDate(): Date {
    return this._dueDate;
  }
  get settledAt(): Date | null {
    return this._settledAt;
  }
  get description(): string | null {
    return this._description;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  get settlements(): FinancialObligationSettlementEntity[] {
    return [...this._settlements];
  }

  get settledPrincipalAmount(): string {
    return this.formatCents(
      this._settlements.reduce(
        (total, settlement) => total + this.toCents(settlement.principalAmount),
        0n,
      ),
    );
  }

  get discountAmount(): string {
    return this.formatCents(
      this._settlements.reduce(
        (total, settlement) => total + this.toCents(settlement.discountAmount),
        0n,
      ),
    );
  }

  get remainingAmount(): string {
    const remaining =
      this.toCents(this.amount) -
      this.toCents(this.settledPrincipalAmount);

    return this.formatCents(remaining > 0n ? remaining : 0n);
  }

  get totalSettledAmount(): string {
    return this.formatCents(
      this._settlements.reduce(
        (total, settlement) => total + this.toCents(settlement.settledAmount),
        0n,
      ),
    );
  }

  /** Retorna o contrato público sem expor o armazenamento privado da entidade. */
  toJSON(): FinancialObligationProps {
    return {
      id: this.id,
      tenantId: this.tenantId,
      userId: this.userId,
      accountId: this.accountId,
      categoryId: this.categoryId,
      subCategoryId: this.subCategoryId,
      transactionId: this.transactionId,
      sourceType: this.sourceType,
      sourceId: this.sourceId,
      type: this.type,
      status: this.status,
      title: this.title,
      counterparty: this.counterparty,
      amount: this.amount,
      dueDate: this.dueDate,
      settledAt: this.settledAt,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      settlements: this.settlements,
    };
  }

  updateDetails(props: {
    accountId: string;
    categoryId: string;
    subCategoryId?: string | null;
    type: FinancialObligationType;
    title: string;
    amount: string;
    dueDate: Date;
    counterparty?: string | null;
    description?: string | null;
  }): void {
    this.ensurePending();
    this._accountId = props.accountId;
    this._categoryId = props.categoryId;
    this._subCategoryId = props.subCategoryId ?? null;
    this._type = props.type;
    this._title = this.validateTitle(props.title);
    this._amount = this.normalizeAmount(props.amount);
    this._dueDate = this.validateDate(props.dueDate, 'Due date is invalid');
    this._counterparty = props.counterparty?.trim() || null;
    this._description = props.description?.trim() || null;
    this.touch();
  }

  registerSettlement(settlement: FinancialObligationSettlementEntity): void {
    if (
      this._status !== FinancialObligationStatus.PENDING &&
      this._status !== FinancialObligationStatus.PARTIALLY_SETTLED
    ) {
      throw new Error('Only open financial obligations can receive settlements');
    }

    if (
      settlement.obligationId !== this.id ||
      settlement.tenantId !== this.tenantId ||
      settlement.userId !== this.userId
    ) {
      throw new Error('Settlement does not belong to this financial obligation');
    }

    const reduction = this.toCents(settlement.principalAmount);

    if (reduction > this.toCents(this.remainingAmount)) {
      throw new Error('Settlement exceeds the outstanding obligation');
    }

    this._settlements.push(settlement);

    if (this.toCents(this.remainingAmount) === 0n) {
      this._status = FinancialObligationStatus.SETTLED;
      this._settledAt = settlement.settledAt;
    } else {
      this._status = FinancialObligationStatus.PARTIALLY_SETTLED;
      this._settledAt = null;
    }

    this.touch();
  }

  cancel(): void {
    this.ensurePending();
    this._status = FinancialObligationStatus.CANCELED;
    this.touch();
  }

  settle(settledAt: Date): void {
    this.ensurePending();
    this._status = FinancialObligationStatus.SETTLED;
    this._settledAt = this.validateDate(
      settledAt,
      'Settlement date is invalid',
    );
    this.touch();
  }

  linkTransaction(transactionId: string): void {
    if (
      this._status !== FinancialObligationStatus.SETTLED ||
      this._transactionId
    ) {
      throw new Error(
        'A transaction can only be linked once to a settled obligation',
      );
    }
    this._transactionId = transactionId;
    this.touch();
  }

  private validateSource(): void {
    const isManual = this._sourceType === FinancialObligationSourceType.MANUAL;
    const hasSourceId = this._sourceId !== null;

    if (isManual === hasSourceId) {
      throw new Error('Financial obligation source type and identifier are inconsistent');
    }
  }

  private ensurePending(): void {
    if (
      this._status !== FinancialObligationStatus.PENDING ||
      this._transactionId
    ) {
      throw new Error('Only pending financial obligations can be modified');
    }
  }

  private validateTitle(title: string): string {
    const normalized = title.trim();
    if (normalized.length < 2 || normalized.length > 160) {
      throw new Error(
        'Financial obligation title must be between 2 and 160 characters',
      );
    }
    return normalized;
  }

  private normalizeAmount(value: string): string {
    const normalized = value.trim();
    if (!/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/.test(normalized)) {
      throw new Error('Financial obligation amount must be greater than zero');
    }
    const [whole, fraction = ''] = normalized.split('.');
    if (
      whole.length > 10 ||
      BigInt(`${whole}${fraction.padEnd(2, '0')}`) <= 0n
    ) {
      throw new Error(
        'Financial obligation amount is outside the supported range',
      );
    }
    return `${whole}.${fraction.padEnd(2, '0')}`;
  }

  private validateDate(date: Date, message: string): Date {
    if (Number.isNaN(date.getTime())) {
      throw new Error(message);
    }
    return date;
  }

  private toCents(value: string): bigint {
    const [whole, fraction] = value.split('.');
    return BigInt(whole) * 100n + BigInt(fraction ?? '00');
  }

  private formatCents(value: bigint): string {
    return `${value / 100n}.${(value % 100n).toString().padStart(2, '0')}`;
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
