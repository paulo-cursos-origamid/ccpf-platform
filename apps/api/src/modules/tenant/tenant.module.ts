import { Module } from '@nestjs/common';

import { ListMyTenantsUseCase } from './application/use-cases/list-my-tenants.use-case';

import { TenantMemberRepository } from './domain/repositories/tenant-member.repository';
import { TenantRepository } from './domain/repositories/tenant.repository';

import { PrismaTenantMemberRepository } from './infrastructure/persistence/prisma-tenant-member.repository';
import { PrismaTenantRepository } from './infrastructure/persistence/prisma-tenant.repository';

import { TenantController } from './presentation/controllers/tenant.controller';
import { TenantContextGuard } from './presentation/guards/tenant-context.guard';

/**
 * Módulo responsável pelo domínio Tenant.
 *
 * Além das entidades e repositórios do domínio, o módulo fornece:
 *
 * - consulta dos Tenants do usuário autenticado;
 * - validação do Tenant ativo de uma requisição HTTP;
 * - acesso aos repositórios de Tenant e TenantMember.
 */
@Module({
  controllers: [TenantController],

  providers: [
    ListMyTenantsUseCase,
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
