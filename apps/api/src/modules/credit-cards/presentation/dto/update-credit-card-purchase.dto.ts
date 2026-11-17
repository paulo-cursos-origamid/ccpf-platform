import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export class UpdateCreditCardPurchaseDto {
  @IsString()
  @Matches(/^\d+(?:\.\d{1,2})?$/, {
    message: 'Informe um valor monetário positivo com até duas casas decimais.',
  })
  totalAmount!: string;

  @IsInt()
  @Min(1)
  @Max(120)
  installmentCount!: number;
}
