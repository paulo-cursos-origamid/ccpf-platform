import { FinancialObligationEntity } from './financial-obligation.entity';
import { FinancialObligationStatus } from '../enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../enums/financial-obligation-type.enum';
import { FinancialObligationSettlementEntity } from './financial-obligation-settlement.entity';

/** Verifica invariantes de valor, estado e vínculo com transações. */
describe('FinancialObligationEntity', () => {
  const createObligation = () =>
    new FinancialObligationEntity({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: 'account-1',
      categoryId: 'category-1',
      type: FinancialObligationType.PAYABLE,
      title: '  Internet  ',
      amount: '120',
      dueDate: new Date('2026-11-15T12:00:00.000Z'),
    });

  it('normalizes values and starts pending without a transaction', () => {
    const obligation = createObligation();

    expect(obligation.title).toBe('Internet');
    expect(obligation.amount).toBe('120.00');
    expect(obligation.status).toBe(FinancialObligationStatus.PENDING);
    expect(obligation.transactionId).toBeNull();
  });

  it('rejects zero, excessive precision, and invalid titles', () => {
    expect(
      () =>
        new FinancialObligationEntity({
          tenantId: 'tenant-1',
          userId: 'user-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          type: FinancialObligationType.PAYABLE,
          title: 'Internet',
          amount: '0',
          dueDate: new Date(),
        }),
    ).toThrow('Financial obligation amount must be greater than zero');

    expect(
      () =>
        new FinancialObligationEntity({
          tenantId: 'tenant-1',
          userId: 'user-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          type: FinancialObligationType.PAYABLE,
          title: 'Internet',
          amount: '1.999',
          dueDate: new Date(),
        }),
    ).toThrow('Financial obligation amount must be greater than zero');

    expect(
      () =>
        new FinancialObligationEntity({
          tenantId: 'tenant-1',
          userId: 'user-1',
          accountId: 'account-1',
          categoryId: 'category-1',
          type: FinancialObligationType.PAYABLE,
          title: ' ',
          amount: '1.00',
          dueDate: new Date(),
        }),
    ).toThrow(
      'Financial obligation title must be between 2 and 160 characters',
    );
  });

  it('allows transaction linking only once after settlement', () => {
    const obligation = createObligation();

    expect(() => obligation.linkTransaction('transaction-1')).toThrow(
      'A transaction can only be linked once to a settled obligation',
    );

    obligation.settle(new Date('2026-11-15T12:00:00.000Z'));
    obligation.linkTransaction('transaction-1');

    expect(obligation.status).toBe(FinancialObligationStatus.SETTLED);
    expect(obligation.transactionId).toBe('transaction-1');
    expect(() => obligation.linkTransaction('transaction-2')).toThrow(
      'A transaction can only be linked once to a settled obligation',
    );
  });

  it('prevents editing or canceling after settlement', () => {
    const obligation = createObligation();
    obligation.settle(new Date('2026-11-15T12:00:00.000Z'));

    expect(() => obligation.cancel()).toThrow(
      'Only pending financial obligations can be modified',
    );
    expect(() =>
      obligation.updateDetails({
        accountId: 'account-1',
        categoryId: 'category-1',
        type: FinancialObligationType.PAYABLE,
        title: 'Updated internet',
        amount: '120.00',
        dueDate: new Date('2026-11-16T12:00:00.000Z'),
      }),
    ).toThrow('Only pending financial obligations can be modified');
  });

  const createSettlement = (
    overrides: Partial<ConstructorParameters<
      typeof FinancialObligationSettlementEntity
    >[0]> = {},
  ) =>
    new FinancialObligationSettlementEntity({
      obligationId: 'obligation-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      principalAmount: '40',
      settledAt: new Date('2026-11-15T12:00:00.000Z'),
      ...overrides,
    });

  it('tracks successive partial settlements and remaining balance', () => {
    const obligation = new FinancialObligationEntity({
      id: 'obligation-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: 'account-1',
      categoryId: 'category-1',
      type: FinancialObligationType.PAYABLE,
      title: 'Internet',
      amount: '120',
      dueDate: new Date('2026-11-15T12:00:00.000Z'),
    });

    obligation.registerSettlement(createSettlement({ principalAmount: '40' }));

    expect(obligation.status).toBe(FinancialObligationStatus.PARTIALLY_SETTLED);
    expect(obligation.remainingAmount).toBe('80.00');

    obligation.registerSettlement(
      createSettlement({
        principalAmount: '30',
        interestAmount: '5',
        feeAmount: '2',
        discountAmount: '10',
      }),
    );

    expect(obligation.remainingAmount).toBe('40.00');
    expect(obligation.settledPrincipalAmount).toBe('70.00');
    expect(obligation.discountAmount).toBe('10.00');
    expect(obligation.totalSettledAmount).toBe('77.00');
    expect(obligation.settlements).toHaveLength(2);
  });

  it('marks the obligation settled after the remaining principal is paid', () => {
    const obligation = new FinancialObligationEntity({
      id: 'obligation-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: 'account-1',
      categoryId: 'category-1',
      type: FinancialObligationType.PAYABLE,
      title: 'Internet',
      amount: '120',
      dueDate: new Date('2026-11-15T12:00:00.000Z'),
    });

    obligation.registerSettlement(createSettlement({ principalAmount: '120' }));

    expect(obligation.status).toBe(FinancialObligationStatus.SETTLED);
    expect(obligation.remainingAmount).toBe('0.00');
    expect(obligation.settledAt).toEqual(new Date('2026-11-15T12:00:00.000Z'));
  });

  it('allows a discount to settle the remaining balance without cash movement', () => {
    const obligation = new FinancialObligationEntity({
      id: 'obligation-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: 'account-1',
      categoryId: 'category-1',
      type: FinancialObligationType.PAYABLE,
      title: 'Internet',
      amount: '120',
      dueDate: new Date('2026-11-15T12:00:00.000Z'),
    });

    obligation.registerSettlement(
      createSettlement({
        principalAmount: '0',
        discountAmount: '120',
      }),
    );

    expect(obligation.status).toBe(FinancialObligationStatus.SETTLED);
    expect(obligation.remainingAmount).toBe('0.00');
    expect(obligation.totalSettledAmount).toBe('0.00');
  });

  it('rejects settlements exceeding the outstanding balance', () => {
    const obligation = new FinancialObligationEntity({
      id: 'obligation-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: 'account-1',
      categoryId: 'category-1',
      type: FinancialObligationType.PAYABLE,
      title: 'Internet',
      amount: '120',
      dueDate: new Date('2026-11-15T12:00:00.000Z'),
    });

    expect(() =>
      obligation.registerSettlement(
        createSettlement({ principalAmount: '121' }),
      ),
    ).toThrow('Settlement exceeds the outstanding obligation');
  });

  it('rejects settlements belonging to another obligation', () => {
    const obligation = new FinancialObligationEntity({
      id: 'obligation-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: 'account-1',
      categoryId: 'category-1',
      type: FinancialObligationType.PAYABLE,
      title: 'Internet',
      amount: '120',
      dueDate: new Date('2026-11-15T12:00:00.000Z'),
    });

    expect(() =>
      obligation.registerSettlement(
        createSettlement({ obligationId: 'another-obligation' }),
      ),
    ).toThrow('Settlement does not belong to this financial obligation');
  });

});
