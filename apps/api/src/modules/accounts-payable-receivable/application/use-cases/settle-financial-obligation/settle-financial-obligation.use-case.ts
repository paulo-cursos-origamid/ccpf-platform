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
    const principalAmount = input.principalAmount ?? obligation.remainingAmount;

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
}
