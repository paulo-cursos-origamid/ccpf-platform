import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRepository } from '../../../../identity/domain/repositories/user.repository';

import { TenantMemberEntity } from '../../../domain/entities/tenant-member.entity';
import { TenantMemberStatus } from '../../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../domain/repositories/tenant-member.repository';
import { TenantPlanLimitsRepository } from '../../../domain/repositories/tenant-plan-limits.repository';

export interface AddTenantMemberInput {
  tenantId: string;
  userId: string;
  memberUserId: string;
  role: TenantRole;
}

/**
 * Adiciona ou reativa um usuário existente da plataforma
 * no Tenant.
 *
 * O usuário que executa a operação precisa ser OWNER ou ADMIN
 * dentro do Tenant.
 *
 * O usuário que será adicionado precisa:
 * - existir na plataforma;
 * - estar ativo;
 * - não possuir vínculo ativo com o Tenant.
 *
 * Quando já existe uma associação com status REMOVED,
 * o mesmo registro é reutilizado e reativado.
 *
 * A quantidade de membros também é limitada pelo plano
 * da assinatura vigente do Tenant.
 */
@Injectable()
export class AddTenantMemberUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
    private readonly tenantPlanLimitsRepository: TenantPlanLimitsRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: AddTenantMemberInput): Promise<void> {
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

    const user = await this.userRepository.findById(input.memberUserId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User is not active');
    }

    const existingMember =
      await this.tenantMemberRepository.findByTenantAndUser(
        input.tenantId,
        input.memberUserId,
      );

    /**
     * Quando o usuário já possui uma associação REMOVED,
     * o vínculo existente é reativado em vez de criar
     * um novo registro.
     */
    if (existingMember?.status === TenantMemberStatus.REMOVED) {
      await this.validatePlanLimit(input.tenantId);

      existingMember.changeRole(input.role);
      existingMember.restore();

      await this.tenantMemberRepository.update(existingMember);

      return;
    }

    /**
     * Qualquer associação diferente de REMOVED ainda
     * representa um vínculo existente com o Tenant.
     */
    if (existingMember) {
      throw new ConflictException('User is already a member of this Tenant');
    }

    await this.validatePlanLimit(input.tenantId);

    const member = new TenantMemberEntity({
      tenantId: input.tenantId,
      userId: input.memberUserId,
      role: input.role,
      status: TenantMemberStatus.ACTIVE,
    });

    await this.tenantMemberRepository.create(member);
  }

  /**
   * Valida se o Tenant possui uma assinatura utilizável
   * e se ainda existe capacidade para adicionar um usuário.
   */
  private async validatePlanLimit(tenantId: string): Promise<void> {
    const maxUsers =
      await this.tenantPlanLimitsRepository.findMaxUsersByTenant(tenantId);

    if (maxUsers === null) {
      throw new ForbiddenException(
        'O Tenant não possui uma assinatura ativa ou em período de teste.',
      );
    }

    if (maxUsers === -1) {
      return;
    }

    const currentUsers =
      await this.tenantMemberRepository.countByTenant(tenantId);

    if (currentUsers >= maxUsers) {
      throw new ForbiddenException(
        'O limite de usuários do plano foi atingido.',
      );
    }
  }
}
