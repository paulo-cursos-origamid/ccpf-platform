import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { PaymentMethod } from '../../domain/enums/payment-method.enum';

/**
 * Dados recebidos pela API para criar uma tentativa
 * de pagamento de uma parcela da Invoice.
 *
 * O invoiceId é obtido pela rota.
 * O valor e os instrumentos de pagamento são gerados pelo backend.
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: 'Identificador da parcela que será paga.',
    example: '8b6c7d8e-1234-4567-8901-abcdef123456',
  })
  @IsUUID()
  installmentId!: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
    description: 'Instrumento utilizado para o pagamento.',
  })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({
    example: '2026-10-04T17:58:20.631Z',
    description:
      'Data de expiração da cobrança. Se omitida, utiliza o vencimento da parcela.',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional({
    example: 'TXID-EXEMPLO-001',
    description: 'Referência externa da cobrança.',
  })
  @IsOptional()
  @IsString()
  externalReference?: string;

  @ApiPropertyOptional({
    description: 'Metadados específicos do pagamento.',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
