import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Token utilizado para confirmação do endereço de e-mail.
 */
export class VerifyEmailDto {
  @ApiProperty({
    description: 'Token de verificação enviado ao usuário.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  token!: string;
}
