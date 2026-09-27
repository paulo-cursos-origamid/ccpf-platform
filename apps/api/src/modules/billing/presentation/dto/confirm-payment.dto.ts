import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

/**
 * Dados recebidos pela API para confirmação manual
 * de um Payment.
 */
export class ConfirmPaymentDto {
  @ApiPropertyOptional({
    example: '2026-09-27T18:30:00.000Z',
    description:
      'Data efetiva do pagamento. Quando omitida, utiliza a data/hora atual.',
  })
  @IsOptional()
  @IsISO8601()
  paidAt?: string;
}
