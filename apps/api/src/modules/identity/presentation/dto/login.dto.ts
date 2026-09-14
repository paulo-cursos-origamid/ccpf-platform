import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Credenciais utilizadas para autenticação.
 */
export class LoginDto {
  @ApiProperty({
    description: 'Endereço de e-mail do usuário.',
    example: 'joao@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário.',
    example: 'senha123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
