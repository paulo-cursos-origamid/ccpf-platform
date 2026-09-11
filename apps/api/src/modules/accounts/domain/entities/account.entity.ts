import { randomUUID } from 'node:crypto';

import { AccountStatus } from '../enums/account-status.enum';
import { AccountType } from '../enums/account-type.enum';

export interface AccountProps {
  id?: string;

  name: string;
  type: AccountType;
  currency: string;

  initialBalance: number;
  balance?: number;

  status?: AccountStatus;
  archivedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export class AccountEntity {
  private readonly _id: string;

  private _name: string;
  private _type: AccountType;
  private readonly _currency: string;

  private readonly _initialBalance: number;
  private _balance: number;

  private _status: AccountStatus;
  private _archivedAt: Date | null;

  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AccountProps) {
    this.validateName(props.name);
    this.validateCurrency(props.currency);
    this.validateBalance(props.initialBalance);

    this._id = props.id ?? randomUUID();

    this._name = props.name.trim();
    this._type = props.type;
    this._currency = props.currency.trim().toUpperCase();

    this._initialBalance = props.initialBalance;
    this._balance = props.balance ?? props.initialBalance;

    this._status = props.status ?? AccountStatus.ACTIVE;
    this._archivedAt = props.archivedAt ?? null;

    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get type(): AccountType {
    return this._type;
  }

  get currency(): string {
    return this._currency;
  }

  get initialBalance(): number {
    return this._initialBalance;
  }

  get balance(): number {
    return this._balance;
  }

  get status(): AccountStatus {
    return this._status;
  }

  get archivedAt(): Date | null {
    return this._archivedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateDetails(name: string, type: AccountType): void {
    this.ensureActive();
    this.validateName(name);

    this._name = name.trim();
    this._type = type;

    this.touch();
  }

  archive(): void {
    if (this._status === AccountStatus.ARCHIVED) {
      throw new Error('Account is already archived');
    }

    this._status = AccountStatus.ARCHIVED;
    this._archivedAt = new Date();

    this.touch();
  }

  private ensureActive(): void {
    if (this._status !== AccountStatus.ACTIVE) {
      throw new Error('Archived account cannot be modified');
    }
  }

  private validateName(name: string): void {
    const normalizedName = name.trim();

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      throw new Error('Account name must be between 2 and 100 characters');
    }
  }

  private validateCurrency(currency: string): void {
    if (!currency.trim()) {
      throw new Error('Account currency is required');
    }
  }

  private validateBalance(balance: number): void {
    if (!Number.isFinite(balance)) {
      throw new Error('Account balance must be a valid number');
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
