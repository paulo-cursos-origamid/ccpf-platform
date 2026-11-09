import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class PayCreditCardInvoiceDto {
  @ApiProperty({ description: 'Conta bancária utilizada no pagamento.' })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ description: 'Data e hora do pagamento.' })
  @IsDateString()
  settledAt: string;

  @ApiPropertyOptional({
    description: 'Principal amortizado. Quando omitido, utiliza o saldo restante integral.',
    example: '500.00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  principalAmount?: string;

  @ApiPropertyOptional({ example: '5.00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  interestAmount?: string;

  @ApiPropertyOptional({ example: '2.00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  feeAmount?: string;

  @ApiPropertyOptional({ example: '10.00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/)
  discountAmount?: string;

  @ApiPropertyOptional({ description: 'Descrição complementar.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
