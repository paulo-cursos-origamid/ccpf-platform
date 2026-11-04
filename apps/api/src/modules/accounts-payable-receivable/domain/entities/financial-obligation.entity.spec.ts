import { FinancialObligationEntity } from './financial-obligation.entity';
import { FinancialObligationStatus } from '../enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../enums/financial-obligation-type.enum';

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
});
