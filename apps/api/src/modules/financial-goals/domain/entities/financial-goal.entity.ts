import { randomUUID } from 'crypto';
import { FinancialGoalStatus } from '../enums/financial-goal-status.enum';

export interface FinancialGoalProps {
  id?: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string | null;
  linkedAccountId?: string | null;
  targetAmount: number;
  targetDate?: Date | null;
  status?: FinancialGoalStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class FinancialGoalEntity {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _userId: string;
  private _name: string;
  private _description: string | null;
  private _linkedAccountId: string | null;
  private _targetAmount: number;
  private _targetDate: Date | null;
  private _status: FinancialGoalStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  constructor(props: FinancialGoalProps) {
    this.validateName(props.name);
    this.validateTargetAmount(props.targetAmount);
    this.validateTargetDate(props.targetDate ?? null);

    this._id = props.id ?? randomUUID();
    this._tenantId = props.tenantId;
    this._userId = props.userId;
    this._name = props.name.trim();
    this._description = props.description?.trim() || null;
    this._linkedAccountId = props.linkedAccountId ?? null;
    this._targetAmount = props.targetAmount;
    this._targetDate = props.targetDate ?? null;
    this._status = props.status ?? FinancialGoalStatus.ACTIVE;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this._deletedAt = props.deletedAt ?? null;
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
  get name(): string {
    return this._name;
  }
  get description(): string | null {
    return this._description;
  }
  get linkedAccountId(): string | null {
    return this._linkedAccountId;
  }
  get targetAmount(): number {
    return this._targetAmount;
  }
  get targetDate(): Date | null {
    return this._targetDate;
  }
  get status(): FinancialGoalStatus {
    return this._status;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  updateDetails(props: {
    name: string;
    description?: string | null;
    linkedAccountId?: string | null;
    targetAmount: number;
    targetDate?: Date | null;
  }): void {
    this.ensureActive();
    this.validateName(props.name);
    this.validateTargetAmount(props.targetAmount);
    this.validateTargetDate(props.targetDate ?? null);

    this._name = props.name.trim();
    this._description = props.description?.trim() || null;
    this._linkedAccountId = props.linkedAccountId ?? null;
    this._targetAmount = props.targetAmount;
    this._targetDate = props.targetDate ?? null;
    this.touch();
  }

  archive(): void {
    if (this._status === FinancialGoalStatus.ARCHIVED) {
      throw new Error('Financial goal is already archived');
    }

    this._status = FinancialGoalStatus.ARCHIVED;
    this.touch();
  }

  restore(): void {
    if (this._status !== FinancialGoalStatus.ARCHIVED) {
      throw new Error('Only archived financial goals can be restored');
    }

    this._status = FinancialGoalStatus.ACTIVE;
    this.touch();
  }

  ensureCanReceiveContributions(): void {
    this.ensureActive();
  }

  private ensureActive(): void {
    if (
      this._status !== FinancialGoalStatus.ACTIVE ||
      this._deletedAt !== null
    ) {
      throw new Error('Only active financial goals can be modified');
    }
  }

  private validateName(name: string): void {
    const normalized = name.trim();

    if (normalized.length < 2 || normalized.length > 100) {
      throw new Error(
        'Financial goal name must be between 2 and 100 characters',
      );
    }
  }

  private validateTargetAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Financial goal target amount must be greater than zero');
    }
  }

  private validateTargetDate(date: Date | null): void {
    if (date && Number.isNaN(date.getTime())) {
      throw new Error('Financial goal target date is invalid');
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
