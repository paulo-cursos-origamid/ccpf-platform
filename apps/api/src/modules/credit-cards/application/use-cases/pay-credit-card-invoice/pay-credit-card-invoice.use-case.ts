import { Injectable, NotFoundException } from '@nestjs/common';

import { FinancialObligationSourceType } from '../../../../accounts-payable-receivable/domain/enums/financial-obligation-source-type.enum';
import { FinancialObligationRepository } from '../../../../accounts-payable-receivable/domain/repositories/financial-obligation.repository';
import { SettleFinancialObligationUseCase } from '../../../../accounts-payable-receivable/application/use-cases/settle-financial-obligation/settle-financial-obligation.use-case';

export interface PayCreditCardInvoiceInput {
  invoiceId: string;
  tenantId: string;
  userId: string;
  accountId: string;
  settledAt: Date;
  principalAmount?: string;
  interestAmount?: string;
  feeAmount?: string;
  discountAmount?: string;
  description?: string;
}

@Injectable()
export class PayCreditCardInvoiceUseCase {
  constructor(
    private readonly obligationRepository: FinancialObligationRepository,
    private readonly settleObligation: SettleFinancialObligationUseCase,
  ) {}

  async execute(input: PayCreditCardInvoiceInput) {
    const obligation = await this.obligationRepository.findBySource(
      input.tenantId,
      input.userId,
      FinancialObligationSourceType.CREDIT_CARD_INVOICE,
      input.invoiceId,
    );

    if (!obligation) {
      throw new NotFoundException(
        'Obrigação financeira da fatura não encontrada neste Espaço.',
      );
    }

    return this.settleObligation.execute({
      id: obligation.id,
      tenantId: input.tenantId,
      userId: input.userId,
      accountId: input.accountId,
      settledAt: input.settledAt,
      principalAmount: input.principalAmount,
      interestAmount: input.interestAmount,
      feeAmount: input.feeAmount,
      discountAmount: input.discountAmount,
      description: input.description,
    });
  }
}
