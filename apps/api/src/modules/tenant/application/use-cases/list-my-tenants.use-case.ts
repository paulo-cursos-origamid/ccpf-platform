import { Injectable } from '@nestjs/common';

import { TenantMemberStatus } from '../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../domain/repositories/tenant-member.repository';
import { TenantRepository } from '../../domain/repositories/tenant.repository';

/**
 * Representa um Tenant disponível para o usuário autenticado.
 *
 * Este tipo pertence à camada de aplicação porque representa
 * o resultado necessário para o fluxo de consulta do usuário.
 */
export interface MyTenantResult {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
}

/**
 * Caso de uso responsável por listar os Tenants
 * aos quais o usuário autenticado possui acesso.
 *
 * O usuário pode pertencer a múltiplos Tenants.
 *
 * Portanto, este caso de uso não depende de um Tenant ativo
 * informado por header. Ele descobre todos os Tenants disponíveis
 * para o usuário através dos seus vínculos TenantMember.
 */
@Injectable()
export class ListMyTenantsUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
    private readonly tenantRepository: TenantRepository,
  ) {}

  /**
   * Retorna os Tenants ativos aos quais o usuário possui
   * vínculo TenantMember também ativo.
   */
  async execute(userId: string): Promise<MyTenantResult[]> {
    const memberships = await this.tenantMemberRepository.findByUser(userId);

    const activeMemberships = memberships.filter(
      (membership) => membership.status === TenantMemberStatus.ACTIVE,
    );

    const tenants: Array<MyTenantResult | null> = await Promise.all(
      activeMemberships.map(async (membership) => {
        const tenant = await this.tenantRepository.findById(
          membership.tenantId,
        );

        if (!tenant) {
          return null;
        }

        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          role: membership.role,
        };
      }),
    );

    return tenants.filter(
      (tenant): tenant is MyTenantResult => tenant !== null,
    );
  }
}
