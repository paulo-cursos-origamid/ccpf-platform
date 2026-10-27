import { ConflictException, NotFoundException } from '@nestjs/common';
import { LedgerEntryType, LedgerReferenceType, Prisma } from '@prisma/client';
import { ReverseTransactionUseCase } from './reverse-transaction.use-case';

describe('ReverseTransactionUseCase', () => {
  const input = { id: 'transaction-1', tenantId: 'tenant-1', userId: 'user-1' };
  const transaction = {
    id: input.id,
    tenantId: input.tenantId,
    accountId: 'account-1',
    type: 'INCOME',
    amount: new Prisma.Decimal('125.50'),
  };
  const original = {
    id: 'ledger-1',
    tenantId: input.tenantId,
    accountId: 'account-1',
    type: LedgerEntryType.CREDIT,
    amount: new Prisma.Decimal('125.50'),
    reversedAt: null,
  };

  let tx: any;
  let prisma: any;
  let useCase: ReverseTransactionUseCase;

  beforeEach(() => {
    tx = {
      transaction: {
        findFirst: jest.fn().mockResolvedValue(transaction),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      ledgerEntry: {
        findFirst: jest.fn().mockResolvedValue(original),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: 'reversal-1' }),
      },
      recurringBillOccurrence: {
        findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      installment: {
        findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      accountMember: {
        findFirst: jest.fn().mockResolvedValue({ accountId: 'account-1' }),
      },
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: 'account-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    useCase = new ReverseTransactionUseCase(prisma);
  });

  it('estorna receita, cria lançamento DEBIT e reduz o saldo', async () => {
    const result = await useCase.execute(input);

    expect(result.transactionId).toBe(transaction.id);
    expect(tx.transaction.findFirst).toHaveBeenCalledWith({
      where: { id: input.id, tenantId: input.tenantId, deletedAt: null },
    });
    expect(tx.ledgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: input.tenantId,
        accountId: original.accountId,
        type: LedgerEntryType.DEBIT,
        amount: original.amount,
        referenceId: original.id,
        referenceType: LedgerReferenceType.REVERSAL,
        reversalOfId: original.id,
      }),
    });
    expect(tx.account.updateMany).toHaveBeenCalledWith({
      where: { id: 'account-1', tenantId: input.tenantId },
      data: { balance: { decrement: original.amount } },
    });
    expect(tx.transaction.updateMany).toHaveBeenCalledWith({
      where: { id: transaction.id, tenantId: input.tenantId, deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('não encontra transação de outro Espaço', async () => {
    tx.transaction.findFirst.mockResolvedValue(null);
    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });

  it('rejeita lançamento original ausente ou inconsistente', async () => {
    tx.ledgerEntry.findFirst.mockResolvedValue(null);
    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

    tx.ledgerEntry.findFirst.mockResolvedValue({
      ...original,
      accountId: 'account-other',
    });
    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
  });

  it('rejeita transação já estornada', async () => {
    tx.ledgerEntry.findFirst.mockResolvedValue({
      ...original,
      reversedAt: new Date(),
    });
    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
  });

  it('rejeita quando o lançamento já foi marcado como estornado', async () => {
    tx.ledgerEntry.updateMany.mockResolvedValue({ count: 0 });
    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });

  it('não permite atualizar saldo se a conta não pertence ao Espaço', async () => {
    tx.account.findFirst.mockResolvedValue(null);
    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });

  it('reabre a parcela vinculada ao pagamento estornado', async () => {
    tx.installment.findFirst.mockResolvedValue({
      id: 'installment-1',
      tenantId: input.tenantId,
      transactionId: transaction.id,
      status: 'PAID',
    });

    await useCase.execute(input);

    expect(tx.installment.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: input.tenantId,
        transactionId: transaction.id,
      },
    });

    expect(tx.installment.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'installment-1',
        tenantId: input.tenantId,
        transactionId: transaction.id,
        status: 'PAID',
      },
      data: {
        status: 'PENDING',
        transactionId: null,
        paidAt: null,
      },
    });

    expect(tx.recurringBillOccurrence.updateMany).not.toHaveBeenCalled();
  });

  it('reabre o vencimento recorrente vinculado ao pagamento', async () => {
    tx.recurringBillOccurrence.findFirst.mockResolvedValue({
      id: 'occurrence-1',
      tenantId: input.tenantId,
      transactionId: transaction.id,
      status: 'PAID',
    });

    await useCase.execute(input);

    expect(tx.recurringBillOccurrence.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'occurrence-1',
        tenantId: input.tenantId,
        transactionId: transaction.id,
        status: 'PAID',
      },
      data: {
        status: 'PENDING',
        transactionId: null,
        paidAmount: null,
        paidAt: null,
      },
    });

    expect(tx.installment.updateMany).not.toHaveBeenCalled();
  });

  it('rejeita estorno quando a parcela não pode ser reaberta', async () => {
    tx.installment.findFirst.mockResolvedValue({
      id: 'installment-1',
      tenantId: input.tenantId,
      transactionId: transaction.id,
    });

    tx.installment.updateMany.mockResolvedValue({ count: 0 });

    await expect(useCase.execute(input)).rejects.toThrow(
      ConflictException,
    );

    expect(tx.installment.updateMany).toHaveBeenCalledTimes(1);
  });

  it('rejeita estorno quando o vencimento não pode ser reaberto', async () => {
    tx.recurringBillOccurrence.findFirst.mockResolvedValue({
      id: 'occurrence-1',
      tenantId: input.tenantId,
      transactionId: transaction.id,
    });

    tx.recurringBillOccurrence.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(useCase.execute(input)).rejects.toThrow(
      ConflictException,
    );

    expect(tx.recurringBillOccurrence.updateMany).toHaveBeenCalledTimes(1);
  });

  it('consulta vínculos financeiros somente no Espaço ativo', async () => {
    await useCase.execute(input);

    expect(tx.recurringBillOccurrence.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: input.tenantId,
        transactionId: transaction.id,
      },
    });

    expect(tx.installment.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: input.tenantId,
        transactionId: transaction.id,
      },
    });

    expect(tx.recurringBillOccurrence.updateMany).not.toHaveBeenCalled();
    expect(tx.installment.updateMany).not.toHaveBeenCalled();
  });
});
