import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { FinancialObligationEntity } from '../../domain/entities/financial-obligation.entity';
import { FinancialObligationType } from '../../domain/enums/financial-obligation-type.enum';
import { PrismaFinancialObligationRepository } from './prisma-financial-obligation.repository';

/** Verifica persistência, atomicidade e ausência de efeitos financeiros duplicados. */
describe('PrismaFinancialObligationRepository', () => {
  const obligation = new FinancialObligationEntity({
    id: 'obligation-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    accountId: 'account-1',
    categoryId: 'category-1',
    type: FinancialObligationType.PAYABLE,
    title: 'Internet',
    amount: '120.00',
    dueDate: new Date('2026-11-15T12:00:00.000Z'),
    description: 'Monthly provider bill',
  });

  let tx: any;
  let prisma: any;
  let repository: PrismaFinancialObligationRepository;

  beforeEach(() => {
    tx = {
      financialObligation: {
        findFirst: jest.fn().mockResolvedValue({ id: obligation.id }),
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
    prisma.financialObligation.create.mockResolvedValue({
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
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const created = await repository.create(obligation);

    expect(created.status).toBe('PENDING');
    expect(prisma.financialObligation.create).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('atomically records the transaction, ledger, balance, and link on settlement', async () => {
    const settled = new FinancialObligationEntity({
      ...obligationProps(),
      status: 'SETTLED',
      settledAt: new Date('2026-11-15T12:00:00.000Z'),
    });

    const result = await repository.settle(settled, {
      userId: 'user-1',
      settledAt: settled.settledAt!,
    });

    expect(result.transactionId).toBe('transaction-1');
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.transaction.create).toHaveBeenCalledTimes(1);
    expect(tx.ledgerEntry.create).toHaveBeenCalledTimes(1);
    expect(tx.account.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.financialObligation.updateMany).toHaveBeenCalledTimes(2);
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
    const settled = new FinancialObligationEntity({
      ...obligationProps(),
      status: 'SETTLED',
      transactionId,
      settledAt: new Date('2026-11-15T12:00:00.000Z'),
    });

    const result = await repository.settle(settled, {
      userId: 'user-1',
      settledAt: settled.settledAt!,
      transactionId,
    });

    expect(result.transactionId).toBe(transactionId);
    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();
    expect(tx.financialObligation.updateMany).toHaveBeenCalledTimes(1);
  });

  function obligationProps() {
    return {
      id: obligation.id,
      tenantId: obligation.tenantId,
      userId: obligation.userId,
      accountId: obligation.accountId,
      categoryId: obligation.categoryId,
      subCategoryId: null,
      type: obligation.type,
      title: obligation.title,
      amount: obligation.amount,
      dueDate: obligation.dueDate,
      description: obligation.description,
    };
  }
});
