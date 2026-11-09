import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { TenantMemberRepository } from '../../../tenant/domain/repositories/tenant-member.repository';
import { TenantMemberStatus } from '../../../tenant/domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../tenant/domain/enums/tenant-role.enum';

/**
 * Valida o vínculo ativo do usuário com o Tenant.
 *
 * A existência do vínculo é verificada novamente na aplicação,
 * mesmo quando a requisição já passou pelo TenantContextGuard.
 */
export async function ensureActiveTenantMember(
  repository: TenantMemberRepository,
  tenantId: string,
  userId: string,
): Promise<void> {
  const member = await repository.findByTenantAndUser(tenantId, userId);

  if (!member) {
    throw new NotFoundException('Tenant member not found');
  }

  if (member.status !== TenantMemberStatus.ACTIVE) {
    throw new ForbiddenException('Tenant member access is not active');
  }
}

/**
 * Somente OWNER e ADMIN podem alterar cartões.
 */
export async function ensureTenantCardManager(
  repository: TenantMemberRepository,
  tenantId: string,
  userId: string,
): Promise<void> {
  const member = await repository.findByTenantAndUser(tenantId, userId);

  if (!member) {
    throw new NotFoundException('Tenant member not found');
  }

  if (member.status !== TenantMemberStatus.ACTIVE) {
    throw new ForbiddenException('Tenant member access is not active');
  }

  if (member.role !== TenantRole.OWNER && member.role !== TenantRole.ADMIN) {
    throw new ForbiddenException(
      'Only Tenant OWNER or ADMIN can manage credit cards',
    );
  }
}


/**
 * Cadastro de compras é permitido para membros ativos,
 * exceto VIEWER, que possui acesso somente de leitura.
 */
export async function ensureTenantCardPurchaseAccess(
  repository: TenantMemberRepository,
  tenantId: string,
  userId: string,
): Promise<void> {
  const member = await repository.findByTenantAndUser(tenantId, userId);

  if (!member) {
    throw new NotFoundException('Tenant member not found');
  }

  if (member.status !== TenantMemberStatus.ACTIVE) {
    throw new ForbiddenException('Tenant member access is not active');
  }

  if (member.role === TenantRole.VIEWER) {
    throw new ForbiddenException(
      'Tenant VIEWER cannot register credit card purchases',
    );
  }
}
