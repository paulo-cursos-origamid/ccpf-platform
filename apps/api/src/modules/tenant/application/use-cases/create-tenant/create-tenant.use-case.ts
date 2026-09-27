import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { TenantMemberEntity } from '../../../domain/entities/tenant-member.entity';
import { TenantEntity } from '../../../domain/entities/tenant.entity';
import { TenantMemberStatus } from '../../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../domain/enums/tenant-role.enum';
import { TenantStatus } from '../../../domain/enums/tenant-status.enum';
import { TenantProvisioningRepository } from '../../../domain/repositories/tenant-provisioning.repository';
import { TenantRepository } from '../../../domain/repositories/tenant.repository';

export interface CreateTenantInput {
  name: string;
  slug: string;
  ownerUserId: string;
}

@Injectable()
export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly tenantProvisioningRepository: TenantProvisioningRepository,
  ) {}

  async execute(input: CreateTenantInput) {
    const name = input.name.trim();
    const slug = input.slug.trim().toLowerCase();

    if (!name) {
      throw new BadRequestException('Nome do Tenant é obrigatório.');
    }

    if (!slug) {
      throw new BadRequestException('Slug do Tenant é obrigatório.');
    }

    if (!input.ownerUserId.trim()) {
      throw new BadRequestException(
        'Usuário proprietário do Tenant é obrigatório.',
      );
    }

    const existingTenant = await this.tenantRepository.findBySlug(slug);

    if (existingTenant) {
      throw new ConflictException('Já existe um Tenant utilizando este slug.');
    }

    const now = new Date();

    const tenant = new TenantEntity(
      randomUUID(),
      name,
      slug,
      TenantStatus.ACTIVE,
      now,
      now,
    );

    const owner = new TenantMemberEntity({
      tenantId: tenant.id,
      userId: input.ownerUserId,
      role: TenantRole.OWNER,
      status: TenantMemberStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    return this.tenantProvisioningRepository.createWithOwner(tenant, owner);
  }
}
