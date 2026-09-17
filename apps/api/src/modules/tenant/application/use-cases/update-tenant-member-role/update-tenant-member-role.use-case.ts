import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TenantMemberStatus } from '../../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../domain/repositories/tenant-member.repository';

export interface UpdateTenantMemberRoleInput {
  tenantId: string;
  userId: string;
  memberId: string;
  role: TenantRole;
}

/**
 * Altera o papel de um membro dentro do Tenant.
 *
 * Somente OWNER e ADMIN podem administrar os papéis.
 *
 * O próprio OWNER não pode ser rebaixado por esta operação.
 * Isso evita que o Tenant fique sem seu responsável principal.
 */
@Injectable()
export class UpdateTenantMemberRoleUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: UpdateTenantMemberRoleInput): Promise<void> {
    const currentMember =
      await this.tenantMemberRepository.findByTenantAndUser(
        input.tenantId,
        input.userId,
      );

    if (!currentMember) {
      throw new ForbiddenException('User does not belong to this Tenant');
    }

    if (currentMember.status !== TenantMemberStatus.ACTIVE) {
      throw new ForbiddenException('User access to this Tenant is not active');
    }

    if (
      currentMember.role !== TenantRole.OWNER &&
      currentMember.role !== TenantRole.ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage Tenant members',
      );
    }

    const targetMember = await this.tenantMemberRepository.findByTenantAndUser(
      input.tenantId,
      input.memberId,
    );

    if (!targetMember) {
      throw new NotFoundException('Tenant member not found');
    }

    if (targetMember.status === TenantMemberStatus.REMOVED) {
      throw new ForbiddenException('Tenant member has been removed');
    }

    if (
      targetMember.role === TenantRole.OWNER &&
      input.role !== TenantRole.OWNER
    ) {
      throw new ForbiddenException(
        'The Tenant OWNER cannot be demoted through this operation',
      );
    }

    targetMember.changeRole(input.role);

    await this.tenantMemberRepository.update(targetMember);
  }
}
