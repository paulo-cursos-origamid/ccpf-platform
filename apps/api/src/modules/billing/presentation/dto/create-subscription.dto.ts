import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Dados recebidos pela API para contratação de um plano.
 *
 * O Tenant é obtido através do TenantContextGuard.
 * Portanto, o cliente não envia tenantId no body.
 */
export class CreateSubscriptionDto {
  @ApiProperty({
    example: 'TRIAL',
    description: 'Código do plano comercial que será contratado.',
  })
  @IsString()
  @IsNotEmpty()
  planCode!: string;
}
