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

export interface AddTenantMemberInput {
  tenantId: string;
  userId: string;
  memberUserId: string;
  role: TenantRole;
}

/**
 * Adiciona um usuário existente da plataforma ao Tenant.
 *
 * O usuário que executa a operação precisa ser OWNER ou ADMIN
 * dentro do Tenant.
 *
 * O usuário que será adicionado precisa:
 * - existir na plataforma;
 * - estar ativo;
 * - ainda não possuir vínculo com o Tenant.
 */
@Injectable()
export class AddTenantMemberUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
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

    if (existingMember) {
      throw new ConflictException('User is already a member of this Tenant');
    }

    const member = new TenantMemberEntity({
      tenantId: input.tenantId,
      userId: input.memberUserId,
      role: input.role,
      status: TenantMemberStatus.ACTIVE,
    });

    await this.tenantMemberRepository.create(member);
  }
}
