import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { AccountType } from '../../domain/enums/account-type.enum';

/**
 * Dados recebidos pela API para atualização dos dados
 * cadastrais de uma conta.
 */
export class UpdateAccountDto {
  @ApiProperty({
    description: 'Novo nome da conta.',
    example: 'Conta Corrente Principal',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Novo tipo da conta.',
    enum: AccountType,
    example: AccountType.CHECKING,
  })
  @IsEnum(AccountType)
  type!: AccountType;
}
