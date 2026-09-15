import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountMemberStatus } from '../../../domain/enums/account-member-status.enum';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';

/**
 * Dados necessários para alterar o papel de um membro.
 */
export interface UpdateAccountMemberRoleInput {
  userId: string;
  tenantId: string;
  accountId: string;
  memberId: string;
  role: AccountMemberRole;
}

/**
 * Altera a função de um membro dentro de uma conta.
 *
 * Regras:
 * - somente OWNER pode alterar permissões;
 * - OWNER não pode alterar o próprio papel;
 * - OWNER não pode ser atribuído a outro membro;
 * - o OWNER atual permanece único.
 */
@Injectable()
export class UpdateAccountMemberRoleUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  async execute(input: UpdateAccountMemberRoleInput): Promise<void> {
    // Localiza o usuário atual dentro da conta e do Tenant.
    const currentMember =
      await this.accountMemberRepository.findByAccountIdAndUserId(
        input.accountId,
        input.userId,
        input.tenantId,
      );

    if (!currentMember) {
      throw new NotFoundException('Account not found');
    }

    // Um membro bloqueado não pode administrar permissões.
    if (currentMember.status !== AccountMemberStatus.ACTIVE) {
      throw new ForbiddenException('Account access is blocked');
    }

    // Somente o OWNER possui autoridade para alterar papéis.
    if (currentMember.role !== AccountMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only the account owner can change member permissions',
      );
    }

    // Localiza o membro alvo dentro da mesma conta e Tenant.
    const members = await this.accountMemberRepository.findManyByAccountId(
      input.accountId,
      input.tenantId,
    );

    const targetMember = members.find((member) => member.id === input.memberId);

    if (!targetMember) {
      throw new NotFoundException('Account member not found');
    }

    // O OWNER não pode alterar a própria permissão.
    if (targetMember.userId === input.userId) {
      throw new BadRequestException(
        'The account owner cannot change their own role',
      );
    }

    // Não permite criar um segundo OWNER através desta operação.
    if (input.role === AccountMemberRole.OWNER) {
      throw new BadRequestException(
        'The account owner role cannot be assigned to another member',
      );
    }

    // A entidade aplica a alteração de papel.
    targetMember.changeRole(input.role);

    await this.accountMemberRepository.update(targetMember);
  }
}
