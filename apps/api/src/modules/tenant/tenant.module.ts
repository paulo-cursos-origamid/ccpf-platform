import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';

import { CreateTenantUseCase } from './application/use-cases/create-tenant/create-tenant.use-case';
import { ListMyTenantsUseCase } from './application/use-cases/list-my-tenants.use-case';
import { ListTenantMembersUseCase } from './application/use-cases/list-tenant-members/list-tenant-members.use-case';
import { AddTenantMemberUseCase } from './application/use-cases/add-tenant-member/add-tenant-member.use-case';
import { UpdateTenantMemberRoleUseCase } from './application/use-cases/update-tenant-member-role/update-tenant-member-role.use-case';
import { BlockTenantMemberUseCase } from './application/use-cases/block-tenant-member/block-tenant-member.use-case';
import { UnblockTenantMemberUseCase } from './application/use-cases/unblock-tenant-member/unblock-tenant-member.use-case';
import { RemoveTenantMemberUseCase } from './application/use-cases/remove-tenant-member/remove-tenant-member.use-case';

import { TenantMemberRepository } from './domain/repositories/tenant-member.repository';
import { TenantPlanLimitsRepository } from './domain/repositories/tenant-plan-limits.repository';
import { TenantProvisioningRepository } from './domain/repositories/tenant-provisioning.repository';
import { TenantRepository } from './domain/repositories/tenant.repository';

import { PrismaTenantMemberRepository } from './infrastructure/persistence/prisma-tenant-member.repository';
import { PrismaTenantPlanLimitsRepository } from './infrastructure/persistence/prisma-tenant-plan-limits.repository';
import { PrismaTenantProvisioningRepository } from './infrastructure/persistence/prisma-tenant-provisioning.repository';
import { PrismaTenantRepository } from './infrastructure/persistence/prisma-tenant.repository';

import { TenantController } from './presentation/controllers/tenant.controller';
import { TenantContextGuard } from './presentation/guards/tenant-context.guard';

/**
 * Módulo responsável pelo domínio Tenant.
 *
 * Responsabilidades:
 * - disponibilizar as operações relacionadas aos Tenants;
 * - disponibilizar o gerenciamento de membros do Tenant;
 * - provisionar um Tenant juntamente com seu OWNER de forma atômica;
 * - validar o Tenant ativo da requisição;
 * - consultar os limites comerciais aplicáveis ao Tenant;
 * - fornecer os repositórios de Tenant e TenantMember;
 * - consumir o UserRepository do Identity para consultar usuários.
 */
@Module({
  imports: [IdentityModule],

  controllers: [TenantController],

  providers: [
    CreateTenantUseCase,
    ListMyTenantsUseCase,
    ListTenantMembersUseCase,
    AddTenantMemberUseCase,
    UpdateTenantMemberRoleUseCase,
    BlockTenantMemberUseCase,
    UnblockTenantMemberUseCase,
    RemoveTenantMemberUseCase,

    TenantContextGuard,

    {
      provide: TenantRepository,
      useClass: PrismaTenantRepository,
    },

    {
      provide: TenantMemberRepository,
      useClass: PrismaTenantMemberRepository,
    },

    {
      provide: TenantPlanLimitsRepository,
      useClass: PrismaTenantPlanLimitsRepository,
    },

    {
      provide: TenantProvisioningRepository,
      useClass: PrismaTenantProvisioningRepository,
    },
  ],

  exports: [TenantRepository, TenantMemberRepository, TenantContextGuard],
})
export class TenantModule {}
