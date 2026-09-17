import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO utilizado para documentar a resposta da API
 * ao listar os membros de um Tenant.
 */
export class TenantMemberResponseDto {
  @ApiProperty({
    example: '39d7c520-bed1-4920-aeb4-9a973423772b',
  })
  id!: string;

  @ApiProperty({
    example: 'ccce8168-4fe4-4054-8da8-4bbc340e6d51',
  })
  userId!: string;

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
