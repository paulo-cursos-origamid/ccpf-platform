/**
 * Módulo administrativo da plataforma.
 *
 * Responsabilidade:
 * - Agrupar os componentes específicos do Platform Admin Dashboard.
 * - Registrar o caso de uso e seu read repository.
 *
 * A autorização continua centralizada no IdentityModule.
 */

import { Module } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { IdentityModule } from '../identity/identity.module';

import { GetAdminDashboardSummaryUseCase } from './application/use-cases/get-admin-dashboard-summary.use-case';
import { AdminDashboardRepository } from './domain/repositories/admin-dashboard.repository';
import { PrismaAdminDashboardRepository } from './infrastructure/persistence/prisma-admin-dashboard.repository';
import { AdminDashboardController } from './presentation/controllers/admin-dashboard.controller';

@Module({
  imports: [PrismaModule, IdentityModule],

  controllers: [AdminDashboardController],

  providers: [
    GetAdminDashboardSummaryUseCase,
    {
      provide: AdminDashboardRepository,
      useClass: PrismaAdminDashboardRepository,
    },
  ],
})
export class PlatformAdminModule {}
