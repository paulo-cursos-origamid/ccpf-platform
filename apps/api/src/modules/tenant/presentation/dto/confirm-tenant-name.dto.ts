import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmTenantNameDto {
  @ApiProperty({
    description: 'Nome confirmado da empresa.',
    example: 'Minha Empresa Ltda.',
    minLength: 2,
    maxLength: 120,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}
