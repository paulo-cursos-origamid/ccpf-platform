import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * DTO utilizado para alteração da senha do usuário autenticado.
 *
 * A senha atual é necessária para confirmar a identidade
 * do usuário antes que a nova senha seja definida.
 */
export class ChangeMyPasswordDto {
  @ApiProperty({
    description: 'Senha atualmente utilizada pelo usuário.',
    example: 'senha-atual',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @ApiProperty({
    description: 'Nova senha que será utilizada pelo usuário.',
    example: 'nova-senha',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
