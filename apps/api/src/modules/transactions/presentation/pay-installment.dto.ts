import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class PayInstallmentDto {
  @ApiProperty({
    description: 'Data e hora do pagamento no formato ISO 8601.',
    example: '2026-10-25T15:00:00.000Z',
  })
  @IsDateString()
  paidAt!: string;
}
