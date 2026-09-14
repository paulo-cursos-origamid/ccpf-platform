import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/**
 * Dados utilizados para solicitar recuperação de senha.
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Endereço de e-mail associado à conta.',
    example: 'joao@example.com',
  })
  @IsEmail()
  email!: string;
}
