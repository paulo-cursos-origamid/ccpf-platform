import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCreditCardPurchaseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsString()
  @Matches(/^\d+(?:\.\d{1,2})?$/, {
    message: 'Informe um valor monetário positivo com até duas casas decimais.',
  })
  totalAmount!: string;

  @IsDateString()
  purchaseDate!: string;

  @IsInt()
  @Min(1)
  @Max(120)
  installmentCount!: number;

  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
