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
 * Dados necessários para bloquear um membro.
 */
export interface BlockAccountMemberInput {
  userId: string;
  tenantId: string;
  accountId: string;
  memberId: string;
}

/**
 * Bloqueia o acesso de um membro à conta.
 *
 * O bloqueio é específico do vínculo AccountMember.
 * O usuário continua existindo no Identity e pode possuir
 * acesso a outros recursos ou contas.
 */
@Injectable()
export class BlockAccountMemberUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
  ) {}

  async execute(input: BlockAccountMemberInput): Promise<void> {
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

    // Um membro bloqueado não pode executar operações administrativas.
    if (currentMember.status !== AccountMemberStatus.ACTIVE) {
      throw new ForbiddenException('Account access is blocked');
    }

    // Somente o OWNER pode bloquear outros membros.
    if (currentMember.role !== AccountMemberRole.OWNER) {
      throw new ForbiddenException('Only the account owner can block members');
    }

    // Lista somente membros pertencentes à conta dentro do Tenant.
    const members = await this.accountMemberRepository.findManyByAccountId(
      input.accountId,
      input.tenantId,
    );

    const targetMember = members.find((member) => member.id === input.memberId);

    if (!targetMember) {
      throw new NotFoundException('Account member not found');
    }

    // O OWNER não pode bloquear o próprio vínculo.
    if (targetMember.userId === input.userId) {
      throw new BadRequestException(
        'The account owner cannot block themselves',
      );
    }

    // A entidade aplica a alteração de estado do membro.
    targetMember.block();

    await this.accountMemberRepository.update(targetMember);
  }
}
