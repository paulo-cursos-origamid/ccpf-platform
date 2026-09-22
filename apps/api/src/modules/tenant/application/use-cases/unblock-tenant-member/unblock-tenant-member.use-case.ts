import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TenantMemberStatus } from '../../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../domain/repositories/tenant-member.repository';

export interface UnblockTenantMemberInput {
  tenantId: string;
  userId: string;
  memberId: string;
}

/**
 * Restaura o acesso de um membro bloqueado ao Tenant.
 *
 * Somente OWNER e ADMIN podem desbloquear membros.
 */
@Injectable()
export class UnblockTenantMemberUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: UnblockTenantMemberInput): Promise<void> {
    const currentMember = await this.tenantMemberRepository.findByTenantAndUser(
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

    if (targetMember.status === TenantMemberStatus.ACTIVE) {
      return;
    }

    targetMember.unblock();

    await this.tenantMemberRepository.update(targetMember);
  }
}
