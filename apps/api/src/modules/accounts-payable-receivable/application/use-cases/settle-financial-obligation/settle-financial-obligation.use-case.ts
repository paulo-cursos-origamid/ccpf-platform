import { ConflictException, Injectable } from '@nestjs/common';
import { FinancialObligationSettlementEntity } from '../../../domain/entities/financial-obligation-settlement.entity';
import { FinancialObligationStatus } from '../../../domain/enums/financial-obligation-status.enum';
import { FinancialObligationRepository } from '../../../domain/repositories/financial-obligation.repository';
import { FinancialObligationsApplicationService } from '../../financial-obligations-application.service';

export interface SettleFinancialObligationInput {
  id: string;
  tenantId: string;
  userId: string;
  settledAt: Date;
  principalAmount?: string;
  interestAmount?: string;
  feeAmount?: string;
  discountAmount?: string;
  transactionId?: string;
  description?: string;
}

@Injectable()
export class SettleFinancialObligationUseCase {
  constructor(
    private readonly repository: FinancialObligationRepository,
    private readonly obligations: FinancialObligationsApplicationService,
  ) {}

  async execute(input: SettleFinancialObligationInput) {
    const obligation = await this.obligations.findObligation(
      input.id,
      input.tenantId,
      input.userId,
    );

    if (
      obligation.status !== FinancialObligationStatus.PENDING &&
      obligation.status !== FinancialObligationStatus.PARTIALLY_SETTLED
    ) {
      throw new ConflictException(
        'Somente compromissos em aberto podem receber liquidações.',
      );
    }

    await this.obligations.validateReferences(obligation);

    const settledAt = this.obligations.parseDate(
      input.settledAt,
      'Data da liquidação inválida.',
    );

    const discountAmount = input.discountAmount ?? '0.00';
    const principalAmount =
      input.principalAmount ??
      this.subtractAmounts(obligation.remainingAmount, discountAmount);

    let settlement: FinancialObligationSettlementEntity;

    try {
      settlement = new FinancialObligationSettlementEntity({
        obligationId: obligation.id,
        tenantId: obligation.tenantId,
        userId: input.userId,
        principalAmount,
        interestAmount: input.interestAmount ?? '0.00',
        feeAmount: input.feeAmount ?? '0.00',
        discountAmount,
        settledAt,
        transactionId: input.transactionId,
      });

      obligation.registerSettlement(settlement);
    } catch (error) {
      throw new ConflictException(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a liquidação.',
      );
    }

    return this.repository.settle(obligation, {
      settlement,
      description: input.description,
    });
  }

  private subtractAmounts(amount: string, deduction: string): string {
    const toCents = (value: string): bigint => {
      const normalized = value.trim();
      if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
        throw new ConflictException('Valor monetário inválido.');
      }

      const [whole, fraction = ''] = normalized.split('.');
      return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
    };

    const result = toCents(amount) - toCents(deduction);

    if (result < 0n) {
      throw new ConflictException(
        'O desconto não pode ser maior que o saldo restante.',
      );
    }

    return `${result / 100n}.${(result % 100n).toString().padStart(2, '0')}`;
  }
}
