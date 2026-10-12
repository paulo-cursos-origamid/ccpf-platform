import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  Max,
  Min,
} from 'class-validator';

/**
 * Dados recebidos pela API para contratação de uma modalidade comercial.
 *
 * O Tenant é obtido através do TenantContextGuard.
 * O backend valida que o PlanPrice pertence ao plano informado,
 * está ativo e pode ser contratado.
 */
export class CreateSubscriptionDto {
  @ApiProperty({
    example: 'PRO',
    description: 'Código do plano comercial que será contratado.',
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

  @ApiProperty({
    example: 3,
    description:
      'Quantidade de parcelas da primeira Invoice. Valores permitidos: 1, 2, 3, 6 ou 12.',
    required: false,
    enum: [1, 2, 3, 6, 12],
  })
  @IsOptional()
  @IsInt()
  @IsIn([1, 2, 3, 6, 12])
  installmentCount?: number;
}
