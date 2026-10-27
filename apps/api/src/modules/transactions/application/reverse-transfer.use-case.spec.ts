import { ConflictException, NotFoundException } from '@nestjs/common';
import { LedgerEntryType, LedgerReferenceType, Prisma } from '@prisma/client';
import { ReverseTransferUseCase } from './reverse-transfer.use-case';

describe('ReverseTransferUseCase', () => {
  const input = { id: 'transfer-1', tenantId: 'tenant-1', userId: 'user-1' };
  const transfer = {
    id: input.id,
    tenantId: input.tenantId,
    fromAccountId: 'account-1',
    toAccountId: 'account-2',
    amount: new Prisma.Decimal('125.50'),
  };
  const debit = {
    id: 'ledger-debit',
    accountId: 'account-1',
    type: LedgerEntryType.DEBIT,
    amount: new Prisma.Decimal('125.50'),
    reversedAt: null,
  };
  const credit = {
    id: 'ledger-credit',
    accountId: 'account-2',
    type: LedgerEntryType.CREDIT,
    amount: new Prisma.Decimal('125.50'),
    reversedAt: null,
  };

  let tx: any;
  let prisma: any;
  let useCase: ReverseTransferUseCase;

  beforeEach(() => {
    tx = {
      transfer: {
        findFirst: jest.fn().mockResolvedValue(transfer),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      accountMember: {
        findMany: jest.fn().mockResolvedValue([
          { accountId: 'account-1' },
          { accountId: 'account-2' },
        ]),
      },
      account: {
        findFirst: jest.fn(({ where }) =>
          Promise.resolve({
            id: where.id,
            tenantId: input.tenantId,
          }),
        ),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      ledgerEntry: {
        findMany: jest.fn().mockResolvedValue([debit, credit]),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: 'reversal-debit' })
          .mockResolvedValueOnce({ id: 'reversal-credit' }),
      },
    };
    prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    useCase = new ReverseTransferUseCase(prisma);
  });

  it('estorna transferência e grava os dois lançamentos inversos', async () => {
    const result = await useCase.execute(input);

    expect(result).toEqual({
      transferId: transfer.id,
      reversalEntryIds: ['reversal-debit', 'reversal-credit'],
    });
    expect(tx.transfer.findFirst).toHaveBeenCalledWith({
      where: { id: input.id, tenantId: input.tenantId, deletedAt: null },
    });
    expect(tx.ledgerEntry.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        tenantId: input.tenantId,
        userId: input.userId,
        accountId: 'account-1',
        type: LedgerEntryType.CREDIT,
        referenceId: debit.id,
        referenceType: LedgerReferenceType.REVERSAL,
        reversalOfId: debit.id,
      }),
    });
    expect(tx.ledgerEntry.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        tenantId: input.tenantId,
        userId: input.userId,
        accountId: 'account-2',
        type: LedgerEntryType.DEBIT,
        referenceId: credit.id,
        referenceType: LedgerReferenceType.REVERSAL,
        reversalOfId: credit.id,
      }),
    });
    expect(tx.account.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'account-1', tenantId: input.tenantId },
      data: { balance: { increment: transfer.amount } },
    });
    expect(tx.account.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'account-2', tenantId: input.tenantId },
      data: { balance: { decrement: transfer.amount } },
    });
    expect(tx.transfer.updateMany).toHaveBeenCalledWith({
      where: { id: transfer.id, tenantId: input.tenantId, deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('não encontra transferência de outro Espaço', async () => {
    tx.transfer.findFirst.mockResolvedValue(null);
    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });

  it('rejeita lançamentos ausentes ou inconsistentes', async () => {
    tx.ledgerEntry.findMany.mockResolvedValue([debit]);
    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

    tx.ledgerEntry.findMany.mockResolvedValue([
      debit,
      { ...credit, amount: new Prisma.Decimal('99.00') },
    ]);
    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
  });

  it('rejeita transferência já estornada', async () => {
    tx.ledgerEntry.findMany.mockResolvedValue([
      debit,
      { ...credit, reversedAt: new Date() },
    ]);
    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
  });

  it('rejeita quando os lançamentos não podem ser marcados como estornados', async () => {
    tx.ledgerEntry.updateMany.mockResolvedValue({ count: 1 });
    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });

  it('rejeita contas que não pertencem ao Espaço', async () => {
    tx.account.findFirst.mockResolvedValueOnce(null);
    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
  });
});
