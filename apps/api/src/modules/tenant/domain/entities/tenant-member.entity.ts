import { TenantMemberStatus } from '../enums/tenant-member-status.enum';
import { TenantRole } from '../enums/tenant-role.enum';

/**
 * Representa a associação de um usuário a um Tenant.
 *
 * Um mesmo usuário pode pertencer a vários Tenants.
 *
 * A entidade controla o vínculo e o papel do usuário
 * dentro de um Tenant específico.
 */
export class TenantMemberEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public role: TenantRole,
    public status: TenantMemberStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
