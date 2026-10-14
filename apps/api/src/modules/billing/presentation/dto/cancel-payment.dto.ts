import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Responsabilidade:
 * Validar o motivo informado pelo administrador ao cancelar
 * uma tentativa de pagamento.
 */
export class CancelPaymentDto {
  @ApiProperty({
    description: 'Motivo do cancelamento da tentativa de pagamento.',
    example: 'O comprovante não permite confirmar o pagamento.',
    minLength: 5,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'O motivo do cancelamento é obrigatório.' })
  @MinLength(5, {
    message: 'O motivo do cancelamento deve ter pelo menos 5 caracteres.',
  })
  @MaxLength(500, {
    message: 'O motivo do cancelamento deve ter no máximo 500 caracteres.',
  })
  reason!: string;
}
