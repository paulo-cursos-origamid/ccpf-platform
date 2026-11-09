import { FinancialObligationSettlementEntity } from './financial-obligation-settlement.entity';

describe('FinancialObligationSettlementEntity', () => {
  const createSettlement = (
    overrides: Partial<
      ConstructorParameters<typeof FinancialObligationSettlementEntity>[0]
    > = {},
  ) =>
    new FinancialObligationSettlementEntity({
      obligationId: 'obligation-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: 'account-1',
      principalAmount: '100',
      interestAmount: '5',
      feeAmount: '2',
      discountAmount: '10',
      settledAt: new Date('2026-11-04T12:00:00.000Z'),
      ...overrides,
    });

  it('normalizes amounts and calculates the actual cash movement', () => {
    const settlement = createSettlement();

    expect(settlement.principalAmount).toBe('100.00');
    expect(settlement.interestAmount).toBe('5.00');
    expect(settlement.feeAmount).toBe('2.00');
    expect(settlement.discountAmount).toBe('10.00');
    expect(settlement.settledAmount).toBe('97.00');
  });

  it('allows a discount without cash movement', () => {
    const settlement = createSettlement({
      principalAmount: '20',
      interestAmount: '0',
      feeAmount: '0',
      discountAmount: '20',
    });

    expect(settlement.settledAmount).toBe('0.00');
    expect(settlement.discountAmount).toBe('20.00');
  });

  it('rejects a settlement that does not reduce the obligation', () => {
    expect(() =>
      createSettlement({
        principalAmount: '0',
        interestAmount: '0',
        feeAmount: '0',
        discountAmount: '0',
      }),
    ).toThrow('Settlement must reduce the outstanding obligation');
  });

  it('rejects negative values and excessive decimal precision', () => {
    expect(() => createSettlement({ principalAmount: '-1' })).toThrow(
      'Settlement amounts must be zero or positive values',
    );

    expect(() => createSettlement({ principalAmount: '1.999' })).toThrow(
      'Settlement amounts must be zero or positive values',
    );
  });

  it('rejects invalid settlement dates and missing references', () => {
    expect(() => createSettlement({ settledAt: new Date('invalid') })).toThrow(
      'Settlement date is invalid',
    );

    expect(() => createSettlement({ obligationId: ' ' })).toThrow(
      'Settlement references are required',
    );
  });

  it('allows linking only one transaction', () => {
    const settlement = createSettlement();

    settlement.linkTransaction('transaction-1');

    expect(settlement.transactionId).toBe('transaction-1');
    expect(() => settlement.linkTransaction('transaction-2')).toThrow(
      'A transaction can only be linked once to a settlement',
    );
  });
});
