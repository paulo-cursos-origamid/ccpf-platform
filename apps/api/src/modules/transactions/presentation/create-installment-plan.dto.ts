import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInstallmentPlanDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: '1200.00' })
  @Matches(/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/)
  totalAmount!: string;

  @ApiProperty()
  @IsString()
  accountId!: string;

  @ApiProperty()
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @ApiProperty({ example: '2026-10-22T12:00:00.000Z' })
  @IsDateString()
  purchaseDate!: string;

  @ApiProperty({ example: 10, minimum: 2, maximum: 120 })
  @IsInt()
  @Min(2)
  @Max(120)
  installmentCount!: number;

  @ApiProperty({ example: '2026-11-10T12:00:00.000Z' })
  @IsDateString()
  firstDueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
