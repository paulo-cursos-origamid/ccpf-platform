import { NotFoundException } from '@nestjs/common';

import { FinancialObligationEntity } from '../../../../accounts-payable-receivable/domain/entities/financial-obligation.entity';
import { FinancialObligationSourceType } from '../../../../accounts-payable-receivable/domain/enums/financial-obligation-source-type.enum';
import { FinancialObligationRepository } from '../../../../accounts-payable-receivable/domain/repositories/financial-obligation.repository';
import { SettleFinancialObligationUseCase } from '../../../../accounts-payable-receivable/application/use-cases/settle-financial-obligation/settle-financial-obligation.use-case';

import { PayCreditCardInvoiceUseCase } from './pay-credit-card-invoice.use-case';

describe('PayCreditCardInvoiceUseCase', () => {
  let useCase: PayCreditCardInvoiceUseCase;
  let findBySource: jest.Mock;
  let settle: jest.Mock;

  const input = {
    invoiceId: 'invoice-123',
    tenantId: 'tenant-123',
    userId: 'user-123',
    accountId: 'account-123',
    settledAt: new Date('2026-11-08T15:00:00.000Z'),
    principalAmount: '500.00',
    interestAmount: '5.00',
    feeAmount: '2.00',
    discountAmount: '10.00',
    description: 'Pagamento da fatura',
  };

  beforeEach(() => {
    findBySource = jest.fn();
    settle = jest.fn();

    useCase = new PayCreditCardInvoiceUseCase(
      { findBySource } as unknown as FinancialObligationRepository,
      { execute: settle } as unknown as SettleFinancialObligationUseCase,
    );
  });

  it('deve localizar a obrigação e delegar a liquidação', async () => {
    const obligation = {
      id: 'obligation-123',
    } as unknown as FinancialObligationEntity;

    const expectedResult = {
      id: 'obligation-123',
      status: 'SETTLED',
    };

    findBySource.mockResolvedValue(obligation);
    settle.mockResolvedValue(expectedResult);

    const result = await useCase.execute(input);

    expect(findBySource).toHaveBeenCalledWith(
      input.tenantId,
      input.userId,
      FinancialObligationSourceType.CREDIT_CARD_INVOICE,
      input.invoiceId,
    );

    expect(settle).toHaveBeenCalledWith({
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

    expect(result).toEqual(expectedResult);
  });

  it('deve rejeitar quando a obrigação da fatura não existir', async () => {
    findBySource.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(settle).not.toHaveBeenCalled();
  });

  it('deve delegar sem principal explícito quando ele for omitido', async () => {
    const obligation = {
      id: 'obligation-123',
    } as unknown as FinancialObligationEntity;

    findBySource.mockResolvedValue(obligation);
    settle.mockResolvedValue({ status: 'SETTLED' });

    const { principalAmount, ...inputWithoutPrincipal } = input;

    await useCase.execute(inputWithoutPrincipal);

    expect(settle).toHaveBeenCalledWith(
      expect.objectContaining({
        id: obligation.id,
        principalAmount: undefined,
      }),
    );
  });
});
