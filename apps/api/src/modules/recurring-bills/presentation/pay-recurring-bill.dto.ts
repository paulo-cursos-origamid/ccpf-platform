import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class PayRecurringBillDto {
  @ApiProperty({
    example: '185.90',
    description: 'Valor efetivamente pago.',
  })
  @Matches(/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/)
  amount!: string;

  @ApiProperty({
    example: '2026-10-25T12:00:00.000Z',
  })
  @IsDateString()
  paidAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
