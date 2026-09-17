import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { TenantRole } from '../../domain/enums/tenant-role.enum';

/**
 * DTO utilizado para alterar o papel de um membro
 * dentro do Tenant.
 */
export class UpdateTenantMemberRoleDto {
  @ApiProperty({
    description: 'Novo papel do membro dentro do Tenant.',
    enum: TenantRole,
    example: TenantRole.MEMBER,
  })
  @IsEnum(TenantRole)
  role!: TenantRole;
}
