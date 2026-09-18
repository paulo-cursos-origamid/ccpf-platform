import { Injectable } from '@nestjs/common';

import { UserRepository } from '../../../../identity/domain/repositories/user.repository';

import { TenantMemberRepository } from '../../../domain/repositories/tenant-member.repository';

export interface ListTenantMembersInput {
  tenantId: string;
}

export interface TenantMemberOutput {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lista os membros pertencentes ao Tenant ativo.
 *
 * A associação TenantMember mantém somente os dados do vínculo
 * entre usuário e Tenant. Os dados de identidade, como nome e
 * e-mail, são obtidos através do UserRepository.
 *
 * Essa separação mantém a responsabilidade de cada domínio:
 * - Tenant: vínculo, papel e status;
 * - Identity: nome e e-mail do usuário.
 */
@Injectable()
export class ListTenantMembersUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ListTenantMembersInput): Promise<TenantMemberOutput[]> {
    const members = await this.tenantMemberRepository.findByTenant(
      input.tenantId,
    );

    /**
     * Os usuários são consultados em paralelo para evitar que
     * uma consulta seja executada somente após a anterior terminar.
     */
    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await this.userRepository.findById(member.userId);

        return {
          member,
          user,
        };
      }),
    );

    /**
     * Um TenantMember deve apontar para um usuário existente.
     *
     * Caso um usuário tenha sido removido logicamente antes de seu
     * vínculo ser removido, ele não é exposto na listagem.
     */
    return membersWithUsers
      .filter(({ user }) => user !== null)
      .map(({ member, user }) => ({
        id: member.id,
        userId: member.userId,
        name: user!.name,
        email: user!.email,
        role: member.role,
        status: member.status,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      }));
  }
}
