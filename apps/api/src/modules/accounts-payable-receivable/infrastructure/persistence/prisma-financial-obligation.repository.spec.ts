import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { FinancialObligationEntity } from '../../domain/entities/financial-obligation.entity';
import { FinancialObligationSettlementEntity } from '../../domain/entities/financial-obligation-settlement.entity';
import { FinancialObligationType } from '../../domain/enums/financial-obligation-type.enum';
import { FinancialObligationSourceType } from '../../domain/enums/financial-obligation-source-type.enum';
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

  const rawObligation = (overrides: Record<string, unknown> = {}) => ({
    id: obligation.id,
    tenantId: obligation.tenantId,
    userId: obligation.userId,
    accountId: obligation.accountId,
    categoryId: obligation.categoryId,
    subCategoryId: null,
    transactionId: null,
    sourceType: 'MANUAL',
    sourceId: null,
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
    ...overrides,
  });

  const createSettlement = (
    principalAmount: string,
    options: {
      interestAmount?: string;
      feeAmount?: string;
      discountAmount?: string;
      transactionId?: string;
      accountId?: string;
    } = {},
  ) =>
    new FinancialObligationSettlementEntity({
      obligationId: obligation.id,
      tenantId: obligation.tenantId,
      userId: 'user-1',
      accountId: options.accountId ?? obligation.accountId,
      principalAmount,
      interestAmount: options.interestAmount ?? '0.00',
      feeAmount: options.feeAmount ?? '0.00',
      discountAmount: options.discountAmount ?? '0.00',
      transactionId: options.transactionId,
      settledAt,
    });

  const cardInvoiceObligation = () =>
    new FinancialObligationEntity({
      ...obligation.toJSON(),
      accountId: null,
      sourceType: FinancialObligationSourceType.CREDIT_CARD_INVOICE,
      sourceId: 'invoice-1',
    });

  const sourcedObligation = () =>
    new FinancialObligationEntity({
      ...obligation.toJSON(),
      sourceType: FinancialObligationSourceType.RECURRING_BILL_OCCURRENCE,
      sourceId: 'occurrence-1',
    });

  const sourcedRawObligation = () => ({
    ...rawObligation(),
    sourceType: 'RECURRING_BILL_OCCURRENCE',
    sourceId: 'occurrence-1',
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
      creditCardInvoice: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
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
    expect(prisma.financialObligation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sourceType: 'MANUAL', sourceId: null }),
      }),
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('finds a card invoice by active Tenant membership without bank-account membership', async () => {
    prisma.financialObligation.findFirst.mockResolvedValue(
      rawObligation({
        accountId: null,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: 'invoice-1',
      }),
    );

    const result = await repository.findById(
      'obligation-1',
      'tenant-1',
      'user-1',
    );

    expect(result?.accountId).toBeNull();
    expect(prisma.financialObligation.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'obligation-1',
        tenantId: 'tenant-1',
        OR: [
          {
            account: {
              accountMembers: {
                some: { userId: 'user-1', status: 'ACTIVE' },
              },
            },
          },
          {
            sourceType: 'CREDIT_CARD_INVOICE',
            tenant: {
              members: {
                some: { userId: 'user-1', status: 'ACTIVE' },
              },
            },
          },
        ],
      },
      include: { settlements: true },
    });
  });

  it('includes card invoices in the list for active Tenant members', async () => {
    prisma.financialObligation.findMany.mockResolvedValue([
      rawObligation({
        accountId: null,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: 'invoice-1',
      }),
    ]);

    const result = await repository.findMany('tenant-1', 'user-1', {});

    expect(result).toHaveLength(1);
    expect(result[0].accountId).toBeNull();
    expect(prisma.financialObligation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          OR: expect.arrayContaining([
            expect.objectContaining({
              sourceType: 'CREDIT_CARD_INVOICE',
              tenant: {
                members: {
                  some: { userId: 'user-1', status: 'ACTIVE' },
                },
              },
            }),
          ]),
        }),
      }),
    );
  });

  it('finds an obligation by source within the tenant and active membership', async () => {
    prisma.financialObligation.findFirst.mockResolvedValue(
      sourcedRawObligation(),
    );

    const result = await repository.findBySource(
      'tenant-1',
      'user-1',
      FinancialObligationSourceType.RECURRING_BILL_OCCURRENCE,
      'occurrence-1',
    );

    expect(result?.sourceId).toBe('occurrence-1');
    expect(prisma.financialObligation.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        sourceType: 'RECURRING_BILL_OCCURRENCE',
        sourceId: 'occurrence-1',
        account: {
          accountMembers: {
            some: { userId: 'user-1', status: 'ACTIVE' },
          },
        },
      },
      include: { settlements: true },
    });
  });

  it('returns the existing obligation for an already registered source', async () => {
    prisma.financialObligation.findFirst.mockResolvedValue(
      sourcedRawObligation(),
    );

    const result = await repository.createOrFindBySource(sourcedObligation());

    expect(result.sourceType).toBe(
      FinancialObligationSourceType.RECURRING_BILL_OCCURRENCE,
    );
    expect(result.sourceId).toBe('occurrence-1');
    expect(prisma.financialObligation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          sourceType: 'RECURRING_BILL_OCCURRENCE',
          sourceId: 'occurrence-1',
        },
        include: { settlements: true },
      }),
    );
    expect(prisma.financialObligation.create).not.toHaveBeenCalled();
  });

  it('creates an obligation when the source has not been registered', async () => {
    prisma.financialObligation.findFirst.mockResolvedValue(null);
    prisma.financialObligation.create.mockResolvedValue(sourcedRawObligation());

    const result = await repository.createOrFindBySource(sourcedObligation());

    expect(result.sourceId).toBe('occurrence-1');
    expect(prisma.financialObligation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceType: 'RECURRING_BILL_OCCURRENCE',
          sourceId: 'occurrence-1',
        }),
      }),
    );
  });

  it('returns the concurrently created obligation after a source unique conflict', async () => {
    const concurrent = sourcedRawObligation();
    prisma.financialObligation.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(concurrent);

    prisma.financialObligation.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['tenantId', 'sourceType', 'sourceId'] },
      }),
    );

    const result = await repository.createOrFindBySource(sourcedObligation());

    expect(result.sourceId).toBe('occurrence-1');
    expect(prisma.financialObligation.findFirst).toHaveBeenCalledTimes(2);
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

  it('allows a full-discount settlement without financial movements', async () => {
    const settlement = createSettlement('120.00', {
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

  it('pays a credit card invoice through the ledger without creating a transaction', async () => {
    tx.financialObligation.findFirst.mockResolvedValueOnce(
      rawObligation({
        accountId: null,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: 'invoice-1',
      }),
    );
    tx.account.findFirst.mockResolvedValueOnce({ id: 'account-2' });

    const settlement = createSettlement('80.00', {
      accountId: 'account-2',
    });

    const result = await repository.settle(cardInvoiceObligation(), {
      settlement,
      description: 'Pagamento da fatura',
    });

    expect(result.status).toBe('PARTIALLY_SETTLED');
    expect(tx.creditCardInvoice.updateMany).not.toHaveBeenCalled();
    expect(tx.account.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'account-2',
          tenantId: 'tenant-1',
          archivedAt: null,
        }),
      }),
    );
    expect(tx.category.findFirst).not.toHaveBeenCalled();
    expect(tx.subCategory.findFirst).not.toHaveBeenCalled();
    expect(tx.transaction.findFirst).not.toHaveBeenCalled();
    expect(tx.transaction.create).not.toHaveBeenCalled();

    expect(tx.ledgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 'account-2',
          type: 'DEBIT',
          amount: new Prisma.Decimal('80.00'),
          referenceId: settlement.id,
          referenceType: 'CREDIT_CARD_INVOICE_PAYMENT',
        }),
      }),
    );

    expect(tx.account.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'account-2' }),
        data: { balance: { decrement: new Prisma.Decimal('80.00') } },
      }),
    );

    expect(tx.financialObligationSettlement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: settlement.id,
          accountId: 'account-2',
          transactionId: null,
        }),
      }),
    );
  });

  it('marks a credit card invoice as paid after full settlement', async () => {
    tx.financialObligation.findFirst.mockResolvedValueOnce(
      rawObligation({
        accountId: null,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: 'invoice-1',
      }),
    );
    tx.account.findFirst.mockResolvedValueOnce({ id: 'account-2' });

    const settlement = createSettlement('120.00', {
      accountId: 'account-2',
    });

    const result = await repository.settle(cardInvoiceObligation(), {
      settlement,
      description: 'Pagamento integral da fatura',
    });

    expect(result.status).toBe('SETTLED');
    expect(tx.ledgerEntry.create).toHaveBeenCalledTimes(1);
    expect(tx.account.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'invoice-1',
        tenantId: 'tenant-1',
        status: { in: ['OPEN', 'CLOSED'] },
      },
      data: { status: 'PAID' },
    });
  });

  it('rejects transaction links when settling a credit card invoice', async () => {
    tx.financialObligation.findFirst.mockResolvedValueOnce(
      rawObligation({
        accountId: null,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: 'invoice-1',
      }),
    );

    const settlement = createSettlement('50.00', {
      transactionId: 'transaction-1',
    });

    await expect(
      repository.settle(cardInvoiceObligation(), { settlement }),
    ).rejects.toThrow(
      'O pagamento de fatura de cartão não pode ser vinculado a uma transação.',
    );

    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.financialObligationSettlement.create).not.toHaveBeenCalled();
  });

  it('does not create a ledger entry for a fully discounted card invoice settlement', async () => {
    tx.financialObligation.findFirst.mockResolvedValueOnce(
      rawObligation({
        accountId: null,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: 'invoice-1',
      }),
    );

    const settlement = createSettlement('120.00', {
      discountAmount: '120.00',
    });

    const result = await repository.settle(cardInvoiceObligation(), {
      settlement,
    });

    expect(result.status).toBe('SETTLED');
    expect(tx.creditCardInvoice.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'invoice-1',
        tenantId: 'tenant-1',
        status: { in: ['OPEN', 'CLOSED'] },
      },
      data: { status: 'PAID' },
    });
    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();
    expect(tx.financialObligationSettlement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 'account-1',
          transactionId: null,
          settledAmount: new Prisma.Decimal('0.00'),
        }),
      }),
    );
  });
});
