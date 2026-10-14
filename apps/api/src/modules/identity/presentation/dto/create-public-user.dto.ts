import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Dados necessários para o cadastro público de um novo cliente SaaS.
 *
 * O planCode representa apenas a intenção de contratação.
 * A validação definitiva do plano ocorre no backend contra
 * o catálogo de planos disponível para contratação.
 */
export class CreatePublicUserDto {
  @ApiProperty({
    description: 'Nome do usuário.',
    example: 'João da Silva',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Endereço de e-mail do usuário.',
    example: 'joao@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário. Deve possuir no mínimo 6 caracteres.',
    example: 'senha123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description:
      'Código do plano escolhido durante o cadastro público. O backend valida se o plano existe, está ativo e é público.',
    example: 'BASIC',
  })
  @IsString()
  planCode!: string;

  @ApiProperty({
    description:
      'Identificador da modalidade comercial escolhida para o plano. Obrigatório para planos pagos e omitido para TRIAL.',
    example: 'uuid-do-plan-price',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  planPriceId?: string;

  @ApiProperty({
    description:
      'Dia de cobrança para modalidades semestrais e anuais. Deve estar entre 1 e 28.',
    example: 15,
    required: false,
    minimum: 1,
    maximum: 28,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  billingDay?: number;

  @ApiProperty({
    description:
      'Quantidade de parcelas da cobrança inicial. Valores permitidos: 1, 2, 3, 6 ou 12.',
    example: 3,
    required: false,
    enum: [1, 2, 3, 6, 12],
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @IsIn([1, 2, 3, 6, 12])
  installmentCount?: number;
}
