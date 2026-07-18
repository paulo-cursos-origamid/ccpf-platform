import { randomUUID } from 'node:crypto';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface UserProps {
  id?: string;
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserEntity {
  private readonly _id: string;
  private _name: string;
  private _email: string;
  private _password: string;
  private _role: UserRole;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this._id = props.id ?? randomUUID();
    this._name = props.name;
    this._email = props.email;
    this._password = props.password;
    this._role = props.role ?? UserRole.USER;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get role(): UserRole {
    return this._role;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateName(name: string): void {
    this._name = name;
    this.touch();
  }

  changePassword(password: string): void {
    this._password = password;
    this.touch();
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
