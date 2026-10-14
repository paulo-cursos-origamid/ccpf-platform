import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Dados recebidos pela API para alterar o plano/modalidade
 * da assinatura corrente do Tenant.
 *
 * O Tenant é obtido através do TenantContextGuard.
 */
export class ChangeSubscriptionPlanDto {
  @ApiProperty({
    example: 'PRO',
    description:
      'Código do plano comercial que será associado à assinatura corrente.',
  })
  @IsString()
  @IsNotEmpty()
  planCode!: string;

  @ApiProperty({
    example: 'uuid-do-plan-price',
    description: 'Identificador da modalidade/preço escolhida.',
  })
  @IsString()
  @IsNotEmpty()
  planPriceId!: string;

  @ApiProperty({
    example: 15,
    description:
      'Dia de cobrança para modalidades semestrais e anuais. Deve estar entre 1 e 31.',
    required: false,
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  billingDay?: number;
}
