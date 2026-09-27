import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRepository } from '../../../../identity/domain/repositories/user.repository';

import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountMemberStatus } from '../../../domain/enums/account-member-status.enum';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';

/**
 * Dados necessários para listar os membros de uma conta.
 */
export interface ListAccountMembersInput {
  userId: string;
  tenantId: string;
  accountId: string;
}

/**
 * Dados apresentados para cada membro da conta.
 */
export interface ListAccountMembersOutput {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: AccountMemberRole;
  status: AccountMemberStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lista os membros de uma conta.
 *
 * Todas as consultas são restritas ao Tenant ativo.
 */
@Injectable()
export class ListAccountMembersUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ListAccountMembersInput,
  ): Promise<ListAccountMembersOutput[]> {
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

    // Membros bloqueados não podem consultar os demais membros.
    if (currentMember.status !== AccountMemberStatus.ACTIVE) {
      throw new ForbiddenException('Account access is blocked');
    }

    // Busca somente os membros da conta pertencentes ao Tenant.
    const members = await this.accountMemberRepository.findManyByAccountId(
      input.accountId,
      input.tenantId,
    );

    // Complementa o vínculo AccountMember com os dados do Identity.
    return Promise.all(
      members.map(async (member) => {
        const user = await this.userRepository.findById(member.userId);

        if (!user) {
          throw new NotFoundException('User not found');
        }

        return {
          id: member.id,
          userId: member.userId,
          name: user.name,
          email: user.email,
          role: member.role,
          status: member.status,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
        };
      }),
    );
  }
}
