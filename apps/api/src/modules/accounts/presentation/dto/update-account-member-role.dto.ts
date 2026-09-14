import { ApiProperty } from '@nestjs/swagger';

import { AccountMemberRole } from '../../domain/enums/account-member-role.enum';

/**
 * Dados recebidos pela API para alterar a permissão
 * de um membro dentro de uma conta.
 *
 * A regra de negócio impede, entre outras situações,
 * a atribuição do papel OWNER a outro membro.
 */
export class UpdateAccountMemberRoleDto {
  @ApiProperty({
    description: 'Novo papel do membro dentro da conta.',
    enum: AccountMemberRole,
    example: AccountMemberRole.MANAGER,
  })
  role!: AccountMemberRole;
}
