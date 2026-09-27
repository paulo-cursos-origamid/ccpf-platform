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
 * OWNER e ADMIN podem administrar os papéis dos membros.
 *
 * O OWNER é protegido contra rebaixamento e o endpoint
 * não permite criar um segundo OWNER.
 *
 * Uma futura transferência de propriedade deverá possuir
 * uma operação específica, com regras próprias.
 */
@Injectable()
export class UpdateTenantMemberRoleUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: UpdateTenantMemberRoleInput): Promise<void> {
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

    const targetMember = await this.tenantMemberRepository.findById(
      input.memberId,
    );

    if (!targetMember || targetMember.tenantId !== input.tenantId) {
      throw new NotFoundException('Tenant member not found');
    }

    if (targetMember.status === TenantMemberStatus.REMOVED) {
      throw new ForbiddenException('Tenant member has been removed');
    }

    if (targetMember.userId === input.userId) {
      throw new ForbiddenException(
        'You cannot change your own Tenant role through this operation',
      );
    }

    /**
     * O OWNER é único por Tenant.
     *
     * Não permitimos alterar o OWNER através deste endpoint
     * nem atribuir OWNER a outro membro.
     *
     * Uma eventual transferência de propriedade deverá ser
     * implementada separadamente.
     */
    if (
      targetMember.role === TenantRole.OWNER ||
      input.role === TenantRole.OWNER
    ) {
      throw new ForbiddenException(
        'The Tenant OWNER cannot be changed through this operation',
      );
    }

    targetMember.changeRole(input.role);

    await this.tenantMemberRepository.update(targetMember);
  }
}
