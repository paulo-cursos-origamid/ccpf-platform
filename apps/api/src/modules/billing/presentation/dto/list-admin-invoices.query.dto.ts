import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { InvoiceStatus } from '../../domain/enums/invoice-status.enum';

/**
 * Parâmetros de consulta utilizados pela listagem global
 * de Invoices no painel administrativo da plataforma.
 */
export class ListAdminInvoicesQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: 1,
    minimum: 1,
    description: 'Número da página.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Quantidade máxima de Invoices por página.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: 'acme',
    description:
      'Pesquisa por número da Invoice, nome do Tenant ou slug do Tenant.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: InvoiceStatus,
    example: InvoiceStatus.PENDING,
    description: 'Filtra as Invoices pelo status.',
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
