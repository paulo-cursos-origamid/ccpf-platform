import { ApiProperty } from '@nestjs/swagger';

import { AccountType } from '../../domain/enums/account-type.enum';

/**
 * Dados recebidos pela API para criação de uma conta financeira.
 *
 * A conta criada terá automaticamente o usuário autenticado
 * como OWNER.
 */
export class CreateAccountDto {
  @ApiProperty({
    description: 'Nome da conta financeira.',
    example: 'Conta Principal',
  })
  name!: string;

  @ApiProperty({
    description: 'Tipo da conta financeira.',
    enum: AccountType,
    example: AccountType.CHECKING,
  })
  type!: AccountType;

  @ApiProperty({
    description: 'Código da moeda utilizada pela conta.',
    example: 'BRL',
  })
  currency!: string;

  @ApiProperty({
    description: 'Saldo inicial da conta.',
    example: 1000,
    type: Number,
  })
  initialBalance!: number;
}
