import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TenantMemberStatus } from '../../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../domain/repositories/tenant-member.repository';

/**
 * Define os dados necessários para remover
 * um membro de um Tenant.
 */
export interface RemoveTenantMemberInput {
  tenantId: string;
  userId: string;
  memberId: string;
}

/**
 * Remove o acesso de um membro ao Tenant.
 *
 * Somente o OWNER pode remover membros.
 *
 * A remoção é lógica: o registro permanece persistido
 * com status REMOVED para preservar o histórico da associação.
 *
 * Membros REMOVED não ocupam vagas no limite do plano.
 */
@Injectable()
export class RemoveTenantMemberUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: RemoveTenantMemberInput): Promise<void> {
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

    /**
     * Remoção é uma operação administrativa do proprietário.
     *
     * ADMIN continua podendo administrar acesso e roles,
     * mas não pode retirar definitivamente um membro do Tenant.
     */
    if (currentMember.role !== TenantRole.OWNER) {
      throw new ForbiddenException('Only the Tenant OWNER can remove members');
    }

    const targetMember = await this.tenantMemberRepository.findById(
      input.memberId,
    );

    if (!targetMember || targetMember.tenantId !== input.tenantId) {
      throw new NotFoundException('Tenant member not found');
    }

    if (targetMember.userId === input.userId) {
      throw new ForbiddenException(
        'You cannot remove your own Tenant membership',
      );
    }

    if (targetMember.role === TenantRole.OWNER) {
      throw new ForbiddenException(
        'The Tenant OWNER cannot be removed through this operation',
      );
    }

    if (targetMember.status === TenantMemberStatus.REMOVED) {
      return;
    }

    targetMember.remove();

    await this.tenantMemberRepository.update(targetMember);
  }
}
