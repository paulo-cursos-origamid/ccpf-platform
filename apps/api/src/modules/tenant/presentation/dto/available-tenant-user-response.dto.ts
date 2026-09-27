import { ApiProperty } from '@nestjs/swagger';

/**
 * Representa um usuário global que pode ser associado
 * ao Tenant atualmente selecionado.
 *
 * Este DTO expõe somente os dados necessários para
 * seleção no frontend.
 */
export class AvailableTenantUserResponseDto {
  @ApiProperty({
    description: 'ID do usuário.',
    example: '7f8c2a1e-4f2d-4c7a-9f8a-123456789abc',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome do usuário.',
    example: 'João da Silva',
  })
  name!: string;

  @ApiProperty({
    description: 'E-mail do usuário.',
    example: 'joao@example.com',
  })
  email!: string;
}
