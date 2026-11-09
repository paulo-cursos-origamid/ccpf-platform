import { randomUUID } from 'node:crypto';

import { CreditCardBrand } from '../enums/credit-card-brand.enum';
import { CreditCardStatus } from '../enums/credit-card-status.enum';

export interface CreditCardProps {
  id?: string;
  tenantId: string;
  name: string;
  brand: CreditCardBrand;
  lastFourDigits?: string | null;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  status?: CreditCardStatus;
  createdAt?: Date;
  updatedAt?: Date;
  archivedAt?: Date | null;
}

export class CreditCardEntity {
  private readonly _id: string;
  private readonly _tenantId: string;

  private _name: string;
  private _brand: CreditCardBrand;
  private _lastFourDigits: string | null;
  private _creditLimit: number;
  private _closingDay: number;
  private _dueDay: number;
  private _status: CreditCardStatus;

  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _archivedAt: Date | null;

  constructor(props: CreditCardProps) {
    this.validateTenantId(props.tenantId);
    this.validateName(props.name);
    this.validateBrand(props.brand);
    this.validateLastFourDigits(props.lastFourDigits ?? null);
    this.validateCreditLimit(props.creditLimit);
    this.validateDay(props.closingDay, 'closing');
    this.validateDay(props.dueDay, 'due');

    this._id = props.id ?? randomUUID();
    this._tenantId = props.tenantId.trim();

    this._name = props.name.trim();
    this._brand = props.brand;
    this._lastFourDigits = props.lastFourDigits ?? null;
    this._creditLimit = props.creditLimit;
    this._closingDay = props.closingDay;
    this._dueDay = props.dueDay;

    this._status = props.status ?? CreditCardStatus.ACTIVE;

    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();

    this._archivedAt =
      props.archivedAt ??
      (this._status === CreditCardStatus.ARCHIVED ? this._updatedAt : null);

    if (this._status === CreditCardStatus.ACTIVE && this._archivedAt !== null) {
      throw new Error('Active credit card cannot have archivedAt');
    }
  }

  get id(): string {
    return this._id;
  }

  get tenantId(): string {
    return this._tenantId;
  }

  get name(): string {
    return this._name;
  }

  get brand(): CreditCardBrand {
    return this._brand;
  }

  get lastFourDigits(): string | null {
    return this._lastFourDigits;
  }

  get creditLimit(): number {
    return this._creditLimit;
  }

  get closingDay(): number {
    return this._closingDay;
  }

  get dueDay(): number {
    return this._dueDay;
  }

  get status(): CreditCardStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get archivedAt(): Date | null {
    return this._archivedAt;
  }

  updateDetails(props: {
    name?: string;
    brand?: CreditCardBrand;
    lastFourDigits?: string | null;
    creditLimit?: number;
    closingDay?: number;
    dueDay?: number;
  }): void {
    this.ensureActive();

    const name = props.name ?? this._name;
    const brand = props.brand ?? this._brand;
    const lastFourDigits =
      props.lastFourDigits === undefined
        ? this._lastFourDigits
        : props.lastFourDigits;
    const creditLimit = props.creditLimit ?? this._creditLimit;
    const closingDay = props.closingDay ?? this._closingDay;
    const dueDay = props.dueDay ?? this._dueDay;

    this.validateName(name);
    this.validateBrand(brand);
    this.validateLastFourDigits(lastFourDigits);
    this.validateCreditLimit(creditLimit);
    this.validateDay(closingDay, 'closing');
    this.validateDay(dueDay, 'due');

    this._name = name.trim();
    this._brand = brand;
    this._lastFourDigits = lastFourDigits;
    this._creditLimit = creditLimit;
    this._closingDay = closingDay;
    this._dueDay = dueDay;

    this.touch();
  }

  archive(): void {
    if (this._status === CreditCardStatus.ARCHIVED) {
      throw new Error('Credit card is already archived');
    }

    this._status = CreditCardStatus.ARCHIVED;
    this._archivedAt = new Date();

    this.touch();
  }

  private ensureActive(): void {
    if (this._status !== CreditCardStatus.ACTIVE) {
      throw new Error('Only active credit cards can be modified');
    }
  }

  private validateTenantId(tenantId: string): void {
    if (!tenantId?.trim()) {
      throw new Error('Credit card tenantId is required');
    }
  }

  private validateName(name: string): void {
    const normalized = name.trim();

    if (normalized.length < 2 || normalized.length > 100) {
      throw new Error('Credit card name must be between 2 and 100 characters');
    }
  }

  private validateBrand(brand: CreditCardBrand): void {
    if (!Object.values(CreditCardBrand).includes(brand)) {
      throw new Error('Credit card brand is invalid');
    }
  }

  private validateLastFourDigits(value: string | null): void {
    if (value !== null && !/^\d{4}$/.test(value)) {
      throw new Error('Credit card lastFourDigits must contain 4 digits');
    }
  }

  private validateCreditLimit(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Credit card limit must be greater than zero');
    }

    const cents = amount * 100;
    const roundedCents = Math.round(cents);

    if (
      amount > 9_999_999_999.99 ||
      !Number.isSafeInteger(roundedCents) ||
      Math.abs(cents - roundedCents) > 0.000001
    ) {
      throw new Error(
        'Credit card limit must have at most 2 decimal places and fit the supported range',
      );
    }
  }

  private validateDay(day: number, field: string): void {
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new Error(
        `Credit card ${field} day must be an integer between 1 and 31`,
      );
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
