import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty()
  @IsString()
  fromAccountId!: string;

  @ApiProperty()
  @IsString()
  toAccountId!: string;

  @ApiProperty({
    example: '125.50',
    description: 'Valor positivo com até duas casas decimais.',
  })
  @Matches(/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/)
  amount!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
