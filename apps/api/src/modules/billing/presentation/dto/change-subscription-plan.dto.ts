import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Dados recebidos pela API para alterar o plano
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
}
