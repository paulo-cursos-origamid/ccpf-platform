import { randomUUID } from 'crypto';

export interface FinancialGoalContributionProps {
  id?: string;
  tenantId: string;
  goalId: string;
  userId: string;
  amount: number;
  date?: Date;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class FinancialGoalContributionEntity {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _goalId: string;
  private readonly _userId: string;
  private readonly _amount: number;
  private readonly _date: Date;
  private readonly _description: string | null;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;
  private readonly _deletedAt: Date | null;

  constructor(props: FinancialGoalContributionProps) {
    if (!Number.isFinite(props.amount) || props.amount <= 0) {
      throw new Error('Contribution amount must be greater than zero');
    }

    const date = props.date ?? new Date();

    if (Number.isNaN(date.getTime())) {
      throw new Error('Contribution date is invalid');
    }

    this._id = props.id ?? randomUUID();
    this._tenantId = props.tenantId;
    this._goalId = props.goalId;
    this._userId = props.userId;
    this._amount = props.amount;
    this._date = date;
    this._description = props.description?.trim() || null;
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
  get goalId(): string {
    return this._goalId;
  }
  get userId(): string {
    return this._userId;
  }
  get amount(): number {
    return this._amount;
  }
  get date(): Date {
    return this._date;
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
  get deletedAt(): Date | null {
    return this._deletedAt;
  }
}
