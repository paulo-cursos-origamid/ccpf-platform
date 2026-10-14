/**
 * Caso de uso responsável por consultar o resumo do dashboard administrativo.
 *
 * Responsabilidade:
 * - Consultar as permissões do usuário autenticado.
 * - Transformar as permissões em um escopo de leitura do dashboard.
 * - Delegar a consulta agregada ao repositório.
 *
 * O caso de uso não executa consultas diretamente no banco.
 */

import { Inject, Injectable } from '@nestjs/common';

import { PlatformAuthorizationRepository } from '../../../identity/domain/repositories/platform-authorization.repository';

import {
  AdminDashboardRepository,
  AdminDashboardScope,
  AdminDashboardSummary,
} from '../../domain/repositories/admin-dashboard.repository';

@Injectable()
export class GetAdminDashboardSummaryUseCase {
  constructor(
    @Inject(AdminDashboardRepository)
    private readonly adminDashboardRepository: AdminDashboardRepository,

    @Inject(PlatformAuthorizationRepository)
    private readonly platformAuthorizationRepository: PlatformAuthorizationRepository,
  ) {}

  async execute(userId: string): Promise<AdminDashboardSummary> {
    const permissions =
      await this.platformAuthorizationRepository.getUserPermissions(userId);

    const scope: AdminDashboardScope = {
      users: permissions.includes('USERS_READ'),
      tenants: permissions.includes('TENANTS_READ'),
      subscriptions: permissions.includes('SUBSCRIPTIONS_READ'),
      billing: permissions.includes('BILLING_READ'),
    };

    return this.adminDashboardRepository.getSummary(scope);
  }
}
