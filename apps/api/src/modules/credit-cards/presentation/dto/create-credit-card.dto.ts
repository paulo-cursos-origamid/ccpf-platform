import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { CreditCardBrand } from '../../domain/enums/credit-card-brand.enum';

export class CreateCreditCardDto {
  @ApiProperty({ example: 'Cartão principal', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: CreditCardBrand, example: CreditCardBrand.VISA })
  @IsEnum(CreditCardBrand)
  brand!: CreditCardBrand;

  @ApiPropertyOptional({ example: '1234', pattern: '^\\d{4}$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/)
  lastFourDigits?: string | null;

  @ApiProperty({ example: 10000, minimum: 0.01, maximum: 9999999999.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9_999_999_999.99)
  creditLimit!: number;

  @ApiProperty({ example: 10, minimum: 1, maximum: 31 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  closingDay!: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 31 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay!: number;
}
