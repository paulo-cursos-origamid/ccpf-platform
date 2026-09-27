import { Injectable } from '@nestjs/common';

import {
  AvailableTenantUser,
  TenantAvailableUserRepository,
} from '../../../domain/repositories/tenant-available-user.repository';

export interface ListAvailableTenantUsersInput {
  tenantId: string;
}

export type ListAvailableTenantUsersOutput = AvailableTenantUser[];

/**
 * Lista os usuários globais que podem ser adicionados
 * ao Tenant atual.
 *
 * A autorização para acessar esta operação é garantida
 * pelo TenantContextGuard no controller.
 */
@Injectable()
export class ListAvailableTenantUsersUseCase {
  constructor(
    private readonly tenantAvailableUserRepository: TenantAvailableUserRepository,
  ) {}

  async execute(
    input: ListAvailableTenantUsersInput,
  ): Promise<ListAvailableTenantUsersOutput> {
    return this.tenantAvailableUserRepository.findAvailableByTenant(
      input.tenantId,
    );
  }
}
