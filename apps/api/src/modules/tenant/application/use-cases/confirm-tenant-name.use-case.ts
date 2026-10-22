import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { TenantRepository } from '../../domain/repositories/tenant.repository';
import { TenantMemberStatus } from '../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../domain/repositories/tenant-member.repository';

export interface ConfirmTenantNameInput {
  tenantId: string;
  userId: string;
  name: string;
}

@Injectable()
export class ConfirmTenantNameUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: ConfirmTenantNameInput): Promise<void> {
    const currentMember =
      await this.tenantMemberRepository.findByTenantAndUser(
        input.tenantId,
        input.userId,
      );

    if (
      !currentMember ||
      currentMember.status !== TenantMemberStatus.ACTIVE ||
      currentMember.role !== TenantRole.OWNER
    ) {
      throw new ForbiddenException(
        'Somente o proprietário ativo pode confirmar o nome da empresa.',
      );
    }

    const name = input.name.trim();

    if (name.length < 2 || name.length > 120) {
      throw new BadRequestException(
        'O nome da empresa deve ter entre 2 e 120 caracteres.',
      );
    }

    const tenant = await this.tenantRepository.findById(input.tenantId);

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    tenant.name = name;
    tenant.nameConfirmed = true;
    tenant.updatedAt = new Date();

    await this.tenantRepository.update(tenant);
  }
}
