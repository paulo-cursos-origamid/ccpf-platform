import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * Dados utilizados para redefinição da senha.
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperação de senha.',
    example: '7e8f9a0b1c2d3e4f5a6b7c8d9e0f123456789',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'Nova senha. Deve possuir no mínimo 6 caracteres.',
    example: 'novaSenha123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
