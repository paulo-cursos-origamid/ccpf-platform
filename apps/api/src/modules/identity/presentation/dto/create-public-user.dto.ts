import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

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
}
