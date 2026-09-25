import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TenantMemberStatus } from '../../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../domain/repositories/tenant-member.repository';

export interface BlockTenantMemberInput {
  tenantId: string;
  userId: string;
  memberId: string;
}

/**
 * Bloqueia o acesso de um membro ao Tenant.
 *
 * Somente OWNER e ADMIN podem bloquear membros.
 *
 * O usuário não pode bloquear a própria associação ao Tenant.
 * O OWNER também não pode ser bloqueado através desta operação.
 *
 * O memberId recebido pela operação representa o ID da entidade
 * TenantMember, e não o ID do usuário.
 */
@Injectable()
export class BlockTenantMemberUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: BlockTenantMemberInput): Promise<void> {
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

    /**
     * O parâmetro memberId identifica diretamente a associação
     * TenantMember que será bloqueada.
     */
    const targetMember = await this.tenantMemberRepository.findById(
      input.memberId,
    );

    if (!targetMember || targetMember.tenantId !== input.tenantId) {
      throw new NotFoundException('Tenant member not found');
    }

    if (targetMember.userId === input.userId) {
      throw new ForbiddenException(
        'You cannot block your own Tenant membership',
      );
    }

    if (targetMember.role === TenantRole.OWNER) {
      throw new ForbiddenException(
        'The Tenant OWNER cannot be blocked through this operation',
      );
    }

    if (targetMember.status === TenantMemberStatus.BLOCKED) {
      return;
    }

    if (targetMember.status === TenantMemberStatus.REMOVED) {
      throw new ForbiddenException('Tenant member has been removed');
    }

    targetMember.block();

    await this.tenantMemberRepository.update(targetMember);
  }
}
