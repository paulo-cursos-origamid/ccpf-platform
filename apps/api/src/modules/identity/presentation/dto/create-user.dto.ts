import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Dados necessários para criação de um usuário.
 */
export class CreateUserDto {
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
}
