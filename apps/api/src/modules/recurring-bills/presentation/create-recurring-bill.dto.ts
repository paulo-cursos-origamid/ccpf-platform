import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringBillFrequency } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRecurringBillDto {
  @ApiProperty({ example: 'Conta de energia' })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ example: '250.00' })
  @IsOptional()
  @Matches(/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/)
  expectedAmount?: string;

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

  @ApiProperty({ enum: RecurringBillFrequency })
  @IsEnum(RecurringBillFrequency)
  frequency!: RecurringBillFrequency;

  @ApiProperty({ example: 15, minimum: 1, maximum: 31 })
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay!: number;

  @ApiProperty({ example: '2026-11-01T12:00:00.000Z' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
