import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { UserRole } from '../../domain/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome do usuário.',
    example: 'João da Silva',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Endereço de e-mail do usuário.',
    example: 'joao@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Senha do usuário. Deve possuir no mínimo 6 caracteres.',
    example: 'senha123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    description:
      'Perfil administrativo do usuário. Usuários comuns não recebem PlatformRole.',
    enum: UserRole,
    example: UserRole.USER,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
