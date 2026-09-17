import { randomUUID } from 'node:crypto';

import { TenantMemberStatus } from '../enums/tenant-member-status.enum';
import { TenantRole } from '../enums/tenant-role.enum';

export interface TenantMemberProps {
  id?: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  status?: TenantMemberStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Representa a associação de um usuário a um Tenant.
 *
 * Um mesmo usuário pode pertencer a vários Tenants.
 *
 * A entidade controla:
 * - o vínculo com o Tenant;
 * - o usuário associado;
 * - o papel dentro do Tenant;
 * - o status do vínculo.
 */
export class TenantMemberEntity {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _userId: string;

  private _role: TenantRole;
  private _status: TenantMemberStatus;

  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TenantMemberProps) {
    this.validateTenantId(props.tenantId);
    this.validateUserId(props.userId);

    this._id = props.id ?? randomUUID();
    this._tenantId = props.tenantId;
    this._userId = props.userId;

    this._role = props.role;
    this._status = props.status ?? TenantMemberStatus.ACTIVE;

    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
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

  get role(): TenantRole {
    return this._role;
  }

  get status(): TenantMemberStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Altera o papel do usuário dentro do Tenant.
   */
  changeRole(role: TenantRole): void {
    this._role = role;
    this.touch();
  }

  /**
   * Bloqueia o acesso do usuário ao Tenant.
   */
  block(): void {
    this._status = TenantMemberStatus.BLOCKED;
    this.touch();
  }

  /**
   * Restaura o acesso do usuário ao Tenant.
   */
  unblock(): void {
    this._status = TenantMemberStatus.ACTIVE;
    this.touch();
  }

  private validateTenantId(tenantId: string): void {
    if (!tenantId.trim()) {
      throw new Error('TenantMember tenantId is required');
    }
  }

  private validateUserId(userId: string): void {
    if (!userId.trim()) {
      throw new Error('TenantMember userId is required');
    }
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
