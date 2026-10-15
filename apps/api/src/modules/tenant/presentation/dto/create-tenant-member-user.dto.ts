import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

import { TenantRole } from '../../domain/enums/tenant-role.enum';

/**
 * Dados para criar um usuário novo e vinculá-lo diretamente
 * ao Tenant ativo. OWNER nunca pode ser atribuído por este fluxo.
 */
export class CreateTenantMemberUserDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'joao@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: [TenantRole.ADMIN, TenantRole.MEMBER, TenantRole.VIEWER] })
  @IsEnum(TenantRole)
  role!: Exclude<TenantRole, 'OWNER'>;
}
