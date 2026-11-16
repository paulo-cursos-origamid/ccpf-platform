import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, Matches } from "class-validator";
import { FinancialPaymentMethod } from "../../accounts-payable-receivable/domain/enums/financial-payment-method.enum";

export class PayInstallmentDto {
  @ApiProperty({
    description: "Data e hora do pagamento no formato ISO 8601.",
    example: "2026-10-25T15:00:00.000Z",
  })
  @IsDateString()
  paidAt!: string;

  @ApiPropertyOptional({ example: "account-1", description: "Conta utilizada nesta liquidação. Quando omitida, utiliza a conta do planejamento." })
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ enum: FinancialPaymentMethod, description: "Forma de pagamento. Cartão de crédito não é aceito neste fluxo." })
  @IsOptional()
  @IsEnum(FinancialPaymentMethod)
  paymentMethod?: FinancialPaymentMethod;

  @ApiPropertyOptional({ example: "40.00", description: "Principal amortizado nesta liquidação. Quando omitido, utiliza o saldo principal restante." })
  @IsOptional()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  principalAmount?: string;

  @ApiPropertyOptional({ example: "2.50", description: "Juros pagos nesta liquidação." })
  @IsOptional()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  interestAmount?: string;

  @ApiPropertyOptional({ example: "1.00", description: "Taxas ou multas pagas nesta liquidação." })
  @IsOptional()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  feeAmount?: string;

  @ApiPropertyOptional({ example: "5.00", description: "Desconto aplicado ao saldo nesta liquidação." })
  @IsOptional()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  discountAmount?: string;

  @ApiPropertyOptional({ description: "Descrição opcional desta liquidação." })
  @IsOptional()
  description?: string;
}
