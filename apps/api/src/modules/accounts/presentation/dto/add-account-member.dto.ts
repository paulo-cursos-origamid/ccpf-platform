import { ApiProperty } from '@nestjs/swagger';

import { AccountMemberRole } from '../../domain/enums/account-member-role.enum';

/**
 * Dados recebidos pela API para adicionar um novo
 * usuário como membro de uma conta.
 *
 * Este DTO representa somente o contrato HTTP.
 * As regras de autorização ficam no use case.
 */
export class AddAccountMemberDto {
  @ApiProperty({
    description: 'Identificador do usuário que será adicionado à conta.',
    example: 'user-uuid',
  })
  userId!: string;

  @ApiProperty({
    description: 'Papel que o usuário terá dentro da conta.',
    enum: AccountMemberRole,
    example: AccountMemberRole.MEMBER,
  })
  role!: AccountMemberRole;
}
