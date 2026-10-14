import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

import { AccountType } from '../../domain/enums/account-type.enum';

/**
 * Dados recebidos pela API para criação de uma conta financeira.
 *
 * Valida os campos recebidos e mantém suas propriedades durante
 * a aplicação do ValidationPipe configurado com whitelist: true.
 *
 * A conta criada terá automaticamente o usuário autenticado
 * como OWNER.
 */
export class CreateAccountDto {
  @ApiProperty({
    description: 'Nome da conta financeira.',
    example: 'Conta Principal',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Tipo da conta financeira.',
    enum: AccountType,
    example: AccountType.CHECKING,
  })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiProperty({
    description: 'Código da moeda utilizada pela conta.',
    example: 'BRL',
  })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({
    description: 'Saldo inicial da conta.',
    example: 1000,
    type: Number,
  })
  @IsNumber()
  initialBalance!: number;
}
