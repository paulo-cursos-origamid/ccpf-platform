import { randomUUID } from 'node:crypto';

import { AccountMemberRole } from '../enums/account-member-role.enum';

export interface AccountMemberProps {
  id?: string;

  accountId: string;
  userId: string;
  role: AccountMemberRole;

  createdAt?: Date;
  updatedAt?: Date;
}

export class AccountMemberEntity {
  private readonly _id: string;

  private readonly _accountId: string;
  private readonly _userId: string;

  private _role: AccountMemberRole;

  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AccountMemberProps) {
    this.validateAccountId(props.accountId);
    this.validateUserId(props.userId);

    this._id = props.id ?? randomUUID();

    this._accountId = props.accountId;
    this._userId = props.userId;

    this._role = props.role;

    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }

  get accountId(): string {
    return this._accountId;
  }

  get userId(): string {
    return this._userId;
  }

  get role(): AccountMemberRole {
    return this._role;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  changeRole(role: AccountMemberRole): void {
    this._role = role;
    this.touch();
  }

  private validateAccountId(accountId: string): void {
    if (!accountId.trim()) {
      throw new Error('AccountMember accountId is required');
    }
  }

  private validateUserId(userId: string): void {
    if (!userId.trim()) {
      throw new Error('AccountMember userId is required');
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
