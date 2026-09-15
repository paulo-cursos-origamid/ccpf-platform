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
 * Dados necessários para desbloquear um membro.
 */
export interface UnblockAccountMemberInput {
  userId: string;
  tenantId: string;
  accountId: string;
  memberId: string;
}

/**
 * Restaura o acesso de um membro à conta.
 *
 * Somente o OWNER pode desbloquear membros.
 */
@Injectable()
export class UnblockAccountMemberUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  async execute(input: UnblockAccountMemberInput): Promise<void> {
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

    // Um membro bloqueado não pode administrar a conta.
    if (currentMember.status !== AccountMemberStatus.ACTIVE) {
      throw new ForbiddenException('Account access is blocked');
    }

    // Somente o OWNER pode desbloquear membros.
    if (currentMember.role !== AccountMemberRole.OWNER) {
      throw new ForbiddenException(
        'Only the account owner can unblock members',
      );
    }

    // Busca o membro alvo dentro da conta e do Tenant.
    const members = await this.accountMemberRepository.findManyByAccountId(
      input.accountId,
      input.tenantId,
    );

    const targetMember = members.find((member) => member.id === input.memberId);

    if (!targetMember) {
      throw new NotFoundException('Account member not found');
    }

    // O OWNER não pode alterar o próprio vínculo através desta operação.
    if (targetMember.userId === input.userId) {
      throw new BadRequestException(
        'The account owner cannot unblock themselves',
      );
    }

    // A entidade aplica a transição BLOCKED -> ACTIVE.
    targetMember.unblock();

    await this.accountMemberRepository.update(targetMember);
  }
}
