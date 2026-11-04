import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { FinancialObligationEntity } from '../../domain/entities/financial-obligation.entity';
import { FinancialObligationSettlementEntity } from '../../domain/entities/financial-obligation-settlement.entity';
import { FinancialObligationType } from '../../domain/enums/financial-obligation-type.enum';
import { PrismaFinancialObligationRepository } from './prisma-financial-obligation.repository';

describe('PrismaFinancialObligationRepository', () => {
  const settledAt = new Date('2026-11-15T12:00:00.000Z');

  const obligation = new FinancialObligationEntity({
    id: 'obligation-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    accountId: 'account-1',
    categoryId: 'category-1',
    type: FinancialObligationType.PAYABLE,
    title: 'Internet',
    amount: '120.00',
    dueDate: settledAt,
    description: 'Monthly provider bill',
  });

  let tx: any;
  let prisma: any;
  let repository: PrismaFinancialObligationRepository;

  const rawObligation = () => ({
    id: obligation.id,
    tenantId: obligation.tenantId,
    userId: obligation.userId,
    accountId: obligation.accountId,
    categoryId: obligation.categoryId,
    subCategoryId: null,
    transactionId: null,
    type: 'PAYABLE',
    status: 'PENDING',
    title: obligation.title,
    counterparty: null,
    amount: new Prisma.Decimal('120.00'),
    dueDate: obligation.dueDate,
    settledAt: null,
    description: obligation.description,
    createdAt: settledAt,
    updatedAt: settledAt,
    settlements: [],
  });

  const createSettlement = (
    principalAmount: string,
    options: {
      interestAmount?: string;
      feeAmount?: string;
      discountAmount?: string;
      transactionId?: string;
    } = {},
  ) =>
    new FinancialObligationSettlementEntity({
      obligationId: obligation.id,
      tenantId: obligation.tenantId,
      userId: 'user-1',
      principalAmount,
      interestAmount: options.interestAmount ?? '0.00',
      feeAmount: options.feeAmount ?? '0.00',
      discountAmount: options.discountAmount ?? '0.00',
      transactionId: options.transactionId,
      settledAt,
    });

  beforeEach(() => {
    tx = {
      financialObligation: {
        findFirst: jest.fn().mockResolvedValue(rawObligation()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      financialObligationSettlement: {
        create: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: data.id })),
      },
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: obligation.accountId }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      accountMember: {
        findFirst: jest.fn().mockResolvedValue({ role: 'OWNER' }),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue({ id: obligation.categoryId }),
      },
      subCategory: { findFirst: jest.fn() },
      transaction: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'transaction-1' }),
      },
      ledgerEntry: { create: jest.fn().mockResolvedValue({ id: 'ledger-1' }) },
    };

    prisma = {
      financialObligation: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };

    repository = new PrismaFinancialObligationRepository(
      prisma as PrismaService,
    );
  });

  it('creates only the pending commitment', async () => {
    prisma.financialObligation.create.mockResolvedValue(rawObligation());

    const created = await repository.create(obligation);

    expect(created.status).toBe('PENDING');
    expect(prisma.financialObligation.create).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('records a partial settlement and moves only the cash amount', async () => {
    const settlement = createSettlement('50.00');

    const result = await repository.settle(obligation, { settlement });

    expect(result.status).toBe('PARTIALLY_SETTLED');
    expect(result.remainingAmount).toBe('70.00');
    expect(result.settlements).toHaveLength(1);
    expect(result.transactionId).toBeNull();

    expect(tx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: new Prisma.Decimal('50.00'),
        }),
      }),
    );
    expect(tx.ledgerEntry.create).toHaveBeenCalledTimes(1);
    expect(tx.account.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.financialObligationSettlement.create).toHaveBeenCalledTimes(1);
    expect(tx.financialObligation.updateMany).toHaveBeenCalledTimes(1);
  });

  it('settles the remaining amount and records the final status', async () => {
    const settlement = createSettlement('120.00');

    const result = await repository.settle(obligation, { settlement });

    expect(result.status).toBe('SETTLED');
    expect(result.remainingAmount).toBe('0.00');
    expect(result.settledAt).toEqual(settledAt);
    expect(result.transactionId).toBeNull();
    expect(result.settlements[0].transactionId).toBe('transaction-1');
    expect(tx.financialObligationSettlement.create).toHaveBeenCalledTimes(1);
    expect(tx.transaction.create).toHaveBeenCalledTimes(1);
    expect(tx.account.updateMany).toHaveBeenCalledTimes(1);
  });

  it('allows a discount-only settlement without financial movements', async () => {
    const settlement = createSettlement('0.00', {
      discountAmount: '120.00',
    });

    const result = await repository.settle(obligation, { settlement });

    expect(result.status).toBe('SETTLED');
    expect(result.remainingAmount).toBe('0.00');
    expect(result.transactionId).toBeNull();
    expect(tx.financialObligationSettlement.create).toHaveBeenCalledTimes(1);
    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });

  it('links an existing matching transaction without duplicating financial effects', async () => {
    const transactionId = 'existing-transaction';

    tx.transaction.findFirst.mockResolvedValue({
      id: transactionId,
      accountId: obligation.accountId,
      categoryId: obligation.categoryId,
      subCategoryId: null,
      type: 'EXPENSE',
      amount: new Prisma.Decimal('120.00'),
    });

    const settlement = createSettlement('120.00', { transactionId });

    const result = await repository.settle(obligation, { settlement });

    expect(result.status).toBe('SETTLED');
    expect(result.transactionId).toBeNull();
    expect(result.settlements[0].transactionId).toBe(transactionId);
    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();
    expect(tx.financialObligationSettlement.create).toHaveBeenCalledTimes(1);
    expect(tx.financialObligation.updateMany).toHaveBeenCalledTimes(1);
  });
});
