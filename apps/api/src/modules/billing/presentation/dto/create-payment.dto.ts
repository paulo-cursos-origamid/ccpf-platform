import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { PaymentMethod } from '../../domain/enums/payment-method.enum';

/**
 * Dados recebidos pela API para criar uma tentativa
 * de pagamento de uma Invoice.
 *
 * O invoiceId é obtido pela rota e não faz parte do body.
 */
export class CreatePaymentDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
    description: 'Instrumento utilizado para o pagamento.',
  })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({
    example: '2026-10-04T17:58:20.631Z',
    description: 'Data de expiração da cobrança.',
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
    example: '00020126580014BR.GOV.BCB.PIX0136...',
    description: 'Código PIX copia e cola.',
  })
  @IsOptional()
  @IsString()
  pixCopyPaste?: string;

  @ApiPropertyOptional({
    example: '00190500954014481606906809350314337370000000100',
    description: 'Código de barras do boleto.',
  })
  @IsOptional()
  @IsString()
  bankSlipBarcode?: string;

  @ApiPropertyOptional({
    example: '00190.50095 40144.816069 06809.350314 3 37370000000100',
    description: 'Linha digitável do boleto.',
  })
  @IsOptional()
  @IsString()
  bankSlipDigitableLine?: string;

  @ApiPropertyOptional({
    description: 'Metadados específicos do pagamento.',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
