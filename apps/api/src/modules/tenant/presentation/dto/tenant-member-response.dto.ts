import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO utilizado para documentar a resposta da API
 * ao listar os membros de um Tenant.
 *
 * Além dos dados do vínculo com o Tenant, a resposta
 * apresenta os dados básicos da identidade do usuário
 * para que o frontend possa exibir o membro sem precisar
 * realizar uma consulta adicional à API de Identity.
 */
export class TenantMemberResponseDto {
  @ApiProperty({
    description: 'Identificador único do vínculo do membro com o Tenant.',
    example: '39d7c520-bed1-4920-aeb4-9a973423772b',
  })
  id!: string;

  @ApiProperty({
    description: 'Identificador do usuário da plataforma.',
    example: 'ccce8168-4fe4-4054-8da8-4bbc340e6d51',
  })
  userId!: string;

  @ApiProperty({
    description: 'Nome do usuário associado ao Tenant.',
    example: 'Paulo Galdino',
  })
  name!: string;

  @ApiProperty({
    description: 'E-mail do usuário associado ao Tenant.',
    example: 'paulo@example.com',
  })
  email!: string;

  @ApiProperty({
    example: 'MEMBER',
    enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
  })
  role!: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INVITED', 'BLOCKED', 'REMOVED'],
  })
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
