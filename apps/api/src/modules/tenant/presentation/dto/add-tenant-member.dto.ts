import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

import { TenantRole } from '../../domain/enums/tenant-role.enum';

/**
 * DTO utilizado para adicionar um usuário existente
 * ao Tenant atualmente selecionado.
 *
 * O tenantId não faz parte deste DTO porque o Tenant é
 * determinado pelo header X-Tenant-Id e validado pelo
 * TenantContextGuard.
 */
export class AddTenantMemberDto {
  @ApiProperty({
    description: 'Identificador do usuário que será adicionado ao Tenant.',
    example: 'a574de4b-5f0c-4ef3-aa1a-a5ee0cd6034b',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Papel que o usuário terá dentro do Tenant.',
    enum: TenantRole,
    example: TenantRole.MEMBER,
  })
  @IsEnum(TenantRole)
  role!: TenantRole;
}
