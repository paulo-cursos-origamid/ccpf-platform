import { BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { CreateNotificationsForPermissionUseCase } from '../../../../notifications/application/use-cases/create-notifications-for-permission.use-case';
import { NotificationSeverity } from '../../../../notifications/domain/enums/notification-severity.enum';
import { NotificationType } from '../../../../notifications/domain/enums/notification-type.enum';

import { TenantMemberEntity } from '../../../domain/entities/tenant-member.entity';
import { TenantEntity } from '../../../domain/entities/tenant.entity';
import { TenantMemberStatus } from '../../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../domain/enums/tenant-role.enum';
import { TenantStatus } from '../../../domain/enums/tenant-status.enum';
import { TenantProvisioningRepository } from '../../../domain/repositories/tenant-provisioning.repository';
import { TenantRepository } from '../../../domain/repositories/tenant.repository';
import { TenantPlanLimitsRepository } from '../../../domain/repositories/tenant-plan-limits.repository';

export interface CreateTenantInput {
  name: string;
  slug: string;
  ownerUserId: string;
}

@Injectable()
export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly tenantPlanLimitsRepository: TenantPlanLimitsRepository,
    private readonly tenantProvisioningRepository: TenantProvisioningRepository,
    private readonly createNotificationsForPermissionUseCase: CreateNotificationsForPermissionUseCase,
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

    const maxTenants =
      await this.tenantPlanLimitsRepository.findMaxTenantsByUser(input.ownerUserId);

    if (maxTenants === null) {
      throw new ForbiddenException(
        'Não foi encontrada uma assinatura ativa ou um período de teste válido para criar outro Tenant.',
      );
    }

    if (maxTenants !== -1) {
      const currentTenants =
        await this.tenantPlanLimitsRepository.countOwnedTenantsByUser(input.ownerUserId);

      if (currentTenants >= maxTenants) {
        throw new ForbiddenException(
          'O limite de Tenants do seu plano foi atingido.',
        );
      }
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

    const createdTenant =
      await this.tenantProvisioningRepository.createWithOwner(tenant, owner);

    await this.createNotificationsForPermissionUseCase.execute({
      permissionCode: 'TENANTS_READ',
      type: NotificationType.TENANT_CREATED,
      severity: NotificationSeverity.INFO,
      title: 'Novo Tenant criado',
      message: `O Tenant ${createdTenant.tenant.name} foi criado com sucesso.`,
      resourceType: 'TENANT',
      resourceId: createdTenant.tenant.id,
      deduplicationKey: `TENANT_CREATED:${createdTenant.tenant.id}`,
    });

    return createdTenant;
  }
}
