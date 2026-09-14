import { AccountMemberRole } from '../../domain/enums/account-member-role.enum';

/**
 * Dados recebidos pela API para alterar a permissão
 * de um membro dentro de uma conta.
 */
export class UpdateAccountMemberRoleDto {
  role!: AccountMemberRole;
}
