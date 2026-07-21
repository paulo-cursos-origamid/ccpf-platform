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

  isActive?: boolean;

  emailVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpiresAt?: Date | null;

  refreshTokenHash?: string | null;

  passwordResetToken?: string | null;
  passwordResetExpiresAt?: Date | null;

  lastLoginAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export class UserEntity {
  private readonly _id: string;

  private _name: string;
  private _email: string;
  private _password: string;

  private _role: UserRole;

  private _isActive: boolean;

  private _emailVerified: boolean;
  private _verificationToken: string | null;
  private _verificationTokenExpiresAt: Date | null;

  private _refreshTokenHash: string | null;

  private _passwordResetToken: string | null;
  private _passwordResetExpiresAt: Date | null;

  private _lastLoginAt: Date | null;

  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this._id = props.id ?? randomUUID();

    this._name = props.name;
    this._email = props.email;
    this._password = props.password;

    this._role = props.role ?? UserRole.USER;

    this._isActive = props.isActive ?? true;

    this._emailVerified = props.emailVerified ?? false;
    this._verificationToken = props.verificationToken ?? null;
    this._verificationTokenExpiresAt = props.verificationTokenExpiresAt ?? null;

    this._refreshTokenHash = props.refreshTokenHash ?? null;

    this._passwordResetToken = props.passwordResetToken ?? null;
    this._passwordResetExpiresAt = props.passwordResetExpiresAt ?? null;

    this._lastLoginAt = props.lastLoginAt ?? null;

    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get email() {
    return this._email;
  }

  get password() {
    return this._password;
  }

  get role() {
    return this._role;
  }

  get isActive() {
    return this._isActive;
  }

  get emailVerified() {
    return this._emailVerified;
  }

  get verificationToken() {
    return this._verificationToken;
  }

  get verificationTokenExpiresAt() {
    return this._verificationTokenExpiresAt;
  }

  get refreshTokenHash() {
    return this._refreshTokenHash;
  }

  get passwordResetToken() {
    return this._passwordResetToken;
  }

  get passwordResetExpiresAt() {
    return this._passwordResetExpiresAt;
  }

  get lastLoginAt(): Date | null {
    return this._lastLoginAt;
  }
  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  updateName(name: string) {
    this._name = name;
    this.touch();
  }
  updateLastLogin(): void {
    this._lastLoginAt = new Date();
    this.touch();
  }
  changePassword(hash: string) {
    this._password = hash;
    this._passwordResetToken = null;
    this._passwordResetExpiresAt = null;
    this.touch();
  }

  verifyEmail() {
    this._emailVerified = true;
    this._verificationToken = null;
    this._verificationTokenExpiresAt = null;
    this.touch();
  }

  setVerificationToken(token: string, expiresAt: Date) {
    this._verificationToken = token;
    this._verificationTokenExpiresAt = expiresAt;
    this.touch();
  }

  setRefreshToken(hash: string | null) {
    this._refreshTokenHash = hash;
    this.touch();
  }

  setPasswordResetToken(token: string, expiresAt: Date) {
    this._passwordResetToken = token;
    this._passwordResetExpiresAt = expiresAt;
    this.touch();
  }

  activate() {
    this._isActive = true;
    this.touch();
  }

  deactivate() {
    this._isActive = false;
    this.touch();
  }

  private touch() {
    this._updatedAt = new Date();
  }
}
