import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { UserRole } from '../../domain/entities/user.entity';

/**
 * Dados opcionais para atualização administrativa de um usuário.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Nome do usuário.',
    example: 'João da Silva',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    description: 'Endereço de e-mail do usuário.',
    example: 'joao@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Perfil de acesso do usuário.',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Define se o usuário está ativo.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
