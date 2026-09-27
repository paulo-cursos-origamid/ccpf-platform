import { Injectable, NotFoundException } from '@nestjs/common';

import { UserRepository } from '../../../../identity/domain/repositories/user.repository';
// import { TenantMemberStatus } from '../../../tenant/domain/enums/tenant-member-status.enum';
import { TenantMemberStatus } from '../../../../tenant/domain/enums/tenant-member-status.enum';
// import { TenantMemberStatus } from 'src/modules/tenant/domain/enums/tenant-member-status.enum';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';

import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';

/**
 * Dados necessários para listar usuários disponíveis
 * para uma conta dentro de um Tenant.
 */
export interface ListAvailableAccountUsersInput {
  userId: string;
  tenantId: string;
  accountId: string;
}

/**
 * Dados apresentados para cada usuário disponível.
 */
export interface ListAvailableAccountUsersOutput {
  id: string;
  name: string;
  email: string;
}

/**
 * Lista usuários do Tenant que ainda não possuem vínculo
 * com a conta informada.
 */
@Injectable()
export class ListAvailableAccountUsersUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ListAvailableAccountUsersInput,
  ): Promise<ListAvailableAccountUsersOutput[]> {
    // Valida o acesso do usuário atual à conta dentro do Tenant.
    const currentMember =
      await this.accountMemberRepository.findByAccountIdAndUserId(
        input.accountId,
        input.userId,
        input.tenantId,
      );

    if (!currentMember) {
      throw new NotFoundException('Account not found');
    }

    // Somente OWNER e MANAGER podem administrar membros.
    if (
      currentMember.role !== AccountMemberRole.OWNER &&
      currentMember.role !== AccountMemberRole.MANAGER
    ) {
      throw new NotFoundException('Account not found');
    }

    // Busca os membros já associados à conta dentro do Tenant.
    const existingMembers =
      await this.accountMemberRepository.findManyByAccountId(
        input.accountId,
        input.tenantId,
      );

    const existingMemberIds = new Set(
      existingMembers.map((member) => member.userId),
    );

    // Busca os usuários vinculados ao Tenant.
    const tenantMembers = await this.tenantMemberRepository.findByTenant(
      input.tenantId,
    );

    // Mantém somente membros ativos do Tenant que ainda não
    // possuem vínculo com a conta.
    const availableUserIds = tenantMembers
      .filter((member) => member.status === TenantMemberStatus.ACTIVE)
      .map((member) => member.userId)
      .filter((userId) => !existingMemberIds.has(userId));

    // Recupera os dados públicos dos usuários no Identity.
    const users = await Promise.all(
      availableUserIds.map((userId) => this.userRepository.findById(userId)),
    );

    return users
      .filter((user): user is NonNullable<typeof user> => {
        return user !== null && user.isActive;
      })
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }));
  }
}
