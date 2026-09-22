import {} from 'module';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Dados recebidos pela API para criação de um Espaço.
 *
 * O usuário proprietário não é enviado pelo cliente.
 * Ele será obtido através do usuário autenticado.
 */
export class CreateTenantDto {
  @ApiProperty({
    example: 'Minha Organização',
    description: 'Nome de exibição do Espaço.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'minha-organizacao',
    description: 'Identificador único do Espaço utilizado como slug.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hífens.',
  })
  slug!: string;
}
