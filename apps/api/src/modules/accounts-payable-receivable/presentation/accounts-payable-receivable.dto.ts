import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FinancialObligationStatus } from '../domain/enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../domain/enums/financial-obligation-type.enum';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/** Payload validado para cadastrar um compromisso a pagar ou receber. */
export class CreateFinancialObligationDto {
  @ApiProperty({ enum: FinancialObligationType, example: 'PAYABLE' })
  @IsEnum(FinancialObligationType)
  type!: FinancialObligationType;

  @ApiProperty({ example: 'Conta de internet' })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty({
    example: '250.00',
    description: 'Valor positivo com até duas casas decimais.',
  })
  @Matches(/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/)
  amount!: string;

  @ApiProperty({ example: '2026-11-15T12:00:00.000Z' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ description: 'Conta financeira existente no Espaço ativo.' })
  @IsString()
  accountId!: string;

  @ApiProperty({
    description:
      'Categoria de despesa para PAYABLE ou receita para RECEIVABLE.',
  })
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional({
    description: 'Subcategoria pertencente à categoria informada.',
  })
  @IsOptional()
  @IsString()
  subCategoryId?: string | null;

  @ApiPropertyOptional({ example: 'Provedor de internet' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  counterparty?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}

/** Campos opcionais aceitos enquanto o compromisso ainda está pendente. */
export class UpdateFinancialObligationDto {
  @ApiPropertyOptional({ enum: FinancialObligationType })
  @IsOptional()
  @IsEnum(FinancialObligationType)
  type?: FinancialObligationType;

  @ApiPropertyOptional({ example: 'Conta de internet' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional({
    example: '250.00',
    description: 'Novo valor positivo com até duas casas decimais.',
  })
  @IsOptional()
  @Matches(/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/)
  amount?: string;

  @ApiPropertyOptional({ example: '2026-11-15T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subCategoryId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  counterparty?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}

/** Dados da efetivação, com vínculo opcional a uma transação compatível. */
export class SettleFinancialObligationDto {
  @ApiProperty({
    example: '2026-11-15T12:00:00.000Z',
    description: 'Instante em que o pagamento ou recebimento ocorreu.',
  })
  @IsDateString()
  settledAt!: string;

  @ApiPropertyOptional({
    description:
      'Transação já registrada, com valor e classificação compatíveis.',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

/** Filtros opcionais para listar compromissos por direção e estado. */
export class ListFinancialObligationsQuery {
  @ApiPropertyOptional({ enum: FinancialObligationType })
  @IsOptional()
  @IsEnum(FinancialObligationType)
  type?: FinancialObligationType;

  @ApiPropertyOptional({ enum: FinancialObligationStatus })
  @IsOptional()
  @IsEnum(FinancialObligationStatus)
  status?: FinancialObligationStatus;
}

/** Resposta pública compartilhada pelos endpoints de compromissos. */
export class FinancialObligationResponseDto {
  @ApiProperty({ example: 'clx123financialobligation' })
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  accountId!: string;

  @ApiProperty()
  categoryId!: string;

  @ApiPropertyOptional({ nullable: true })
  subCategoryId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ID da transação que efetivou o compromisso.',
  })
  transactionId!: string | null;

  @ApiProperty({ enum: FinancialObligationType, example: 'PAYABLE' })
  type!: FinancialObligationType;

  @ApiProperty({ enum: FinancialObligationStatus, example: 'PENDING' })
  status!: FinancialObligationStatus;

  @ApiProperty({ example: 'Conta de internet' })
  title!: string;

  @ApiPropertyOptional({ nullable: true, example: 'Provedor de internet' })
  counterparty!: string | null;

  @ApiProperty({ example: '250.00' })
  amount!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dueDate!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  settledAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
