import { randomUUID } from 'node:crypto';

import { AccountMemberRole } from '../enums/account-member-role.enum';
import { AccountMemberStatus } from '../enums/account-member-status.enum';

/**
 * Propriedades necessárias para representar um membro de uma conta.
 *
 * Esta entidade pertence ao domínio de Accounts e não conhece Prisma,
 * HTTP ou detalhes de infraestrutura.
 */
export interface AccountMemberProps {
  id?: string;

  accountId: string;
  userId: string;
  role: AccountMemberRole;
  status?: AccountMemberStatus;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidade responsável pelas regras de um vínculo entre usuário e conta.
 *
 * Ela encapsula:
 * - identidade do membro;
 * - papel dentro da conta;
 * - status de acesso;
 * - alteração de papel;
 * - bloqueio e desbloqueio.
 */
export class AccountMemberEntity {
  private readonly _id: string;

  private readonly _accountId: string;
  private readonly _userId: string;

  private _role: AccountMemberRole;
  private _status: AccountMemberStatus;

  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AccountMemberProps) {
    this.validateAccountId(props.accountId);
    this.validateUserId(props.userId);

    this._id = props.id ?? randomUUID();

    this._accountId = props.accountId;
    this._userId = props.userId;

    this._role = props.role;
    this._status = props.status ?? AccountMemberStatus.ACTIVE;

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

  get status(): AccountMemberStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Altera o papel do membro dentro da conta.
   */
  changeRole(role: AccountMemberRole): void {
    this._role = role;
    this.touch();
  }

  /**
   * Bloqueia o acesso do membro à conta.
   */
  block(): void {
    this._status = AccountMemberStatus.BLOCKED;
    this.touch();
  }

  /**
   * Restaura o acesso do membro à conta.
   */
  unblock(): void {
    this._status = AccountMemberStatus.ACTIVE;
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
