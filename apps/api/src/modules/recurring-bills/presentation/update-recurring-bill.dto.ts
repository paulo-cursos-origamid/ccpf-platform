import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateRecurringBillDto {
  @ApiProperty({ example: 15, minimum: 1, maximum: 31 })
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay!: number;

  @ApiPropertyOptional({
    example: '85.40',
    description:
      'Novo valor previsto. Atualiza apenas vencimentos ainda pendentes.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/)
  expectedAmount?: string;
}
