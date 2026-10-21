import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryDomain, CategoryType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alimentação' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'alimentacao' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  @IsEnum(CategoryType)
  type!: CategoryType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ example: '#047857' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string | null;

  @ApiPropertyOptional({ example: 'utensils' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isVehicleCategory?: boolean;

  @ApiPropertyOptional({
    enum: CategoryDomain,
    isArray: true,
    example: [CategoryDomain.DOMESTIC],
    description: 'Domínios financeiros aos quais a categoria pertence.',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CategoryDomain, { each: true })
  domains?: CategoryDomain[];

  @ApiPropertyOptional({ description: 'UUID da categoria pai.' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
