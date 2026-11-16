import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FinancialObligationSourceType } from '../domain/enums/financial-obligation-source-type.enum';
import { FinancialObligationStatus } from '../domain/enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../domain/enums/financial-obligation-type.enum';
import { FinancialPaymentMethod } from '../domain/enums/financial-payment-method.enum';

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
    description: 'Data em que ocorreu esta liquidação.',
  })
  @IsDateString()
  settledAt!: string;

  @ApiPropertyOptional({
    example: '80.00',
    description:
      'Principal amortizado. Quando omitido, utiliza o saldo restante integral. O desconto reduz o valor efetivamente pago, sem reduzir o principal amortizado.',
  })
  @IsOptional()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  principalAmount?: string;

  @ApiPropertyOptional({
    example: '2.50',
    description: 'Juros efetivamente pagos ou recebidos.',
  })
  @IsOptional()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  interestAmount?: string;

  @ApiPropertyOptional({
    example: '1.00',
    description: 'Taxas ou multas efetivamente pagas ou recebidas.',
  })
  @IsOptional()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  feeAmount?: string;

  @ApiPropertyOptional({
    example: '5.00',
    description: 'Desconto que reduz o saldo sem movimentar a conta.',
  })
  @IsOptional()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  discountAmount?: string;

  @ApiPropertyOptional({
    example: 'account-1',
    description:
      'Conta utilizada nesta liquidação. Por padrão, utiliza a conta de referência do compromisso.',
  })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({
    enum: FinancialPaymentMethod,
    description: "Forma utilizada nesta liquidação. Cartão de crédito deve usar o fluxo específico de conversão da recorrência.",
  })
  @IsOptional()
  @IsEnum(FinancialPaymentMethod)
  paymentMethod?: FinancialPaymentMethod;

  @ApiPropertyOptional({
    description:
      'Transação já registrada, com valor e classificação compatíveis. Não se aplica ao pagamento de faturas de cartão.',
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
export class PaginatedFinancialObligationsQuery {
  @ApiPropertyOptional({ enum: FinancialObligationType })
  @IsOptional()
  @IsEnum(FinancialObligationType)
  type?: FinancialObligationType;

  @ApiPropertyOptional({ enum: FinancialObligationStatus })
  @IsOptional()
  @IsEnum(FinancialObligationStatus)
  status?: FinancialObligationStatus;
  @IsOptional()
  @IsEnum(FinancialObligationSourceType)
  sourceType?: FinancialObligationSourceType;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

/** Resposta pública compartilhada pelos endpoints de compromissos. */
export class FinancialObligationResponseDto {
  @ApiProperty({ example: 'clx123financialobligation' })
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ nullable: true })
  accountId!: string | null;

  @ApiProperty({ nullable: true })
  categoryId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  subCategoryId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ID da transação que efetivou o compromisso.',
  })
  transactionId!: string | null;

  @ApiProperty({ enum: FinancialObligationSourceType, example: 'MANUAL' })
  sourceType!: FinancialObligationSourceType;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Identificador do registro que originou o compromisso.',
  })
  sourceId!: string | null;

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

export class ListFinancialObligationsQuery extends OmitType(
  PaginatedFinancialObligationsQuery,
  ['page', 'limit'] as const,
) {}

export class FinancialObligationPaginationDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 45 })
  totalItems!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class FinancialObligationSummaryDto {
  @ApiProperty({ example: 45 })
  totalCount!: number;

  @ApiProperty({ example: 20 })
  pendingCount!: number;

  @ApiProperty({ example: 5 })
  partiallySettledCount!: number;

  @ApiProperty({ example: 15 })
  settledCount!: number;

  @ApiProperty({ example: 5 })
  canceledCount!: number;

  @ApiProperty({ example: '1250.00' })
  totalRemainingAmount!: string;

  @ApiProperty({ example: 3 })
  overdueCount!: number;

  @ApiProperty({ example: '450.00' })
  overdueRemainingAmount!: string;
}

export class PaginatedFinancialObligationsResponseDto {
  @ApiProperty({ type: [FinancialObligationResponseDto] })
  data!: FinancialObligationResponseDto[];

  @ApiProperty({ type: FinancialObligationPaginationDto })
  pagination!: FinancialObligationPaginationDto;

  @ApiProperty({ type: FinancialObligationSummaryDto })
  summary!: FinancialObligationSummaryDto;
}
