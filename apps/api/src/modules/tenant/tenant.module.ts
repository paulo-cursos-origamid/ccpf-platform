import { Module } from '@nestjs/common';

import { TenantMemberRepository } from './domain/repositories/tenant-member.repository';
import { TenantRepository } from './domain/repositories/tenant.repository';

import { PrismaTenantMemberRepository } from './infrastructure/persistence/prisma-tenant-member.repository';
import { PrismaTenantRepository } from './infrastructure/persistence/prisma-tenant.repository';

import { TenantContextGuard } from './presentation/guards/tenant-context.guard';

/**
 * Módulo responsável pelo domínio Tenant.
 *
 * Além das entidades e repositórios do domínio, o módulo fornece
 * a infraestrutura necessária para validar o Tenant ativo de uma
 * requisição HTTP.
 */
@Module({
  providers: [
    TenantContextGuard,

    {
      provide: TenantRepository,
      useClass: PrismaTenantRepository,
    },
    {
      provide: TenantMemberRepository,
      useClass: PrismaTenantMemberRepository,
    },
  ],
  exports: [TenantRepository, TenantMemberRepository, TenantContextGuard],
})
export class TenantModule {}
