import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class PaymentMethodsSummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Mês de referência no formato YYYY-MM. Padrão: mês atual.',
    example: '2026-11',
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'O mês deve estar no formato YYYY-MM.',
  })
  month?: string;
}
