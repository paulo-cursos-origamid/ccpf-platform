import { ApiProperty } from '@nestjs/swagger';

/**
 * Representa um Tenant disponibilizado para o usuário autenticado.
 *
 * Este DTO expõe somente os dados necessários para o frontend
 * identificar e selecionar o Tenant ativo.
 */
export class MyTenantResponseDto {
  @ApiProperty({
    description: 'Identificador único do Tenant.',
    example: '47868065-758e-4194-8223-3642c5cac92c',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome de apresentação do Tenant.',
    example: 'CCPF Desenvolvimento',
  })
  name!: string;

  @ApiProperty({
    description: 'Identificador amigável e único do Tenant.',
    example: 'ccpf-desenvolvimento',
  })
  slug!: string;

  @ApiProperty({
    description: 'Papel do usuário dentro do Tenant.',
    example: 'OWNER',
    enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  })
  role!: string;
}
