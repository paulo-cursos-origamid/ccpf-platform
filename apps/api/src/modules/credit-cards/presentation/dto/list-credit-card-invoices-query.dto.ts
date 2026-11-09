import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class ListCreditCardInvoicesQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por cartão de crédito.' })
  @IsOptional()
  @IsString()
  creditCardId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar pelo status da fatura.',
    enum: ['OPEN', 'CLOSED', 'PAID'],
  })
  @IsOptional()
  @IsIn(['OPEN', 'CLOSED', 'PAID'])
  status?: 'OPEN' | 'CLOSED' | 'PAID';

  @ApiPropertyOptional({
    description: 'Data inicial do período de referência (ISO 8601).',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  referenceMonthFrom?: string;

  @ApiPropertyOptional({
    description: 'Data final do período de referência (ISO 8601).',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  referenceMonthTo?: string;
}
