import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TenantMemberStatus } from '../../../../tenant/domain/enums/tenant-member-status.enum';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';

import { AccountMemberEntity } from '../../../domain/entities/account-member.entity';
import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountMemberStatus } from '../../../domain/enums/account-member-status.enum';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';

/**
 * Dados necessários para adicionar um novo membro à conta.
 *
 * O tenantId identifica o contexto SaaS em que a operação acontece.
 */
export interface AddAccountMemberInput {
  userId: string;
  tenantId: string;
  accountId: string;
  memberUserId: string;
  role: AccountMemberRole;
}

/**
 * Adiciona um usuário como membro de uma conta.
 *
 * A operação exige:
 * - usuário atual pertencente ao Tenant;
 * - usuário atual com acesso ativo à conta;
 * - usuário atual como OWNER ou MANAGER;
 * - usuário convidado pertencente ao mesmo Tenant;
 * - usuário convidado ainda não ser membro da conta.
 */
@Injectable()
export class AddAccountMemberUseCase {
  constructor(
    private readonly accountMemberRepository: AccountMemberRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: AddAccountMemberInput): Promise<void> {
    // Localiza o vínculo do usuário atual com a conta dentro do Tenant.
    const currentMember =
      await this.accountMemberRepository.findByAccountIdAndUserId(
        input.accountId,
        input.userId,
        input.tenantId,
      );

    if (!currentMember) {
      throw new NotFoundException('Account not found');
    }

    // Membro bloqueado não pode administrar os membros da conta.
    if (currentMember.status !== AccountMemberStatus.ACTIVE) {
      throw new ForbiddenException('Account access is blocked');
    }

    // OWNER e MANAGER são os únicos papéis autorizados a gerenciar membros.
    if (
      currentMember.role !== AccountMemberRole.OWNER &&
      currentMember.role !== AccountMemberRole.MANAGER
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage account members',
      );
    }

    // O usuário convidado precisa pertencer ao mesmo Tenant.
    const tenantMember = await this.tenantMemberRepository.findByTenantAndUser(
      input.tenantId,
      input.memberUserId,
    );

    if (!tenantMember) {
      throw new NotFoundException('User does not belong to this Tenant');
    }

    // Somente membros ativos do Tenant podem receber acesso a contas.
    if (tenantMember.status !== TenantMemberStatus.ACTIVE) {
      throw new ForbiddenException('User access to this Tenant is not active');
    }

    // Impede duplicidade do vínculo conta + usuário dentro do Tenant.
    const existingMember =
      await this.accountMemberRepository.findByAccountIdAndUserId(
        input.accountId,
        input.memberUserId,
        input.tenantId,
      );

    if (existingMember) {
      throw new ConflictException('User is already a member of this account');
    }

    // Cria a associação do usuário com a conta.
    const member = new AccountMemberEntity({
      accountId: input.accountId,
      userId: input.memberUserId,
      role: input.role,
    });

    await this.accountMemberRepository.create(member);
  }
}
