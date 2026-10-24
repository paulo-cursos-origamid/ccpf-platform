import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  LedgerEntryType,
  LedgerReferenceType,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import {
  CreateTransactionInput,
  CreateTransactionUseCase,
} from './create-transaction.use-case';

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let prisma: { $transaction: jest.Mock };
  let tx: {
    account: { findFirst: jest.Mock; updateMany: jest.Mock };
    accountMember: { findFirst: jest.Mock };
    category: { findFirst: jest.Mock };
    subCategory: { findFirst: jest.Mock };
    transaction: { create: jest.Mock };
    ledgerEntry: { create: jest.Mock };
  };

  const input: CreateTransactionInput = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    accountId: 'account-1',
    categoryId: 'category-1',
    title: '  Teste financeiro  ',
    amount: '125.50',
    type: TransactionType.INCOME,
    date: '2026-10-22T12:00:00.000Z',
    description: '  Descrição  ',
  };

  const account = { id: 'account-1' };
  const category = { id: 'category-1', type: TransactionType.INCOME };
  const createdTransaction = { id: 'transaction-1' };

  beforeEach(() => {
    tx = {
      account: {
        findFirst: jest.fn().mockResolvedValue(account),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      accountMember: {
        findFirst: jest.fn().mockResolvedValue({ id: 'membership-1' }),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue(category),
      },
      subCategory: {
        findFirst: jest.fn().mockResolvedValue({ id: 'subcategory-1' }),
      },
      transaction: {
        create: jest.fn().mockResolvedValue(createdTransaction),
      },
      ledgerEntry: {
        create: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
      },
    };

    prisma = {
      $transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    useCase = new CreateTransactionUseCase(
      prisma as unknown as PrismaService,
    );
  });

  it('cria receita, lançamento CREDIT e incrementa o saldo', async () => {
    const result = await useCase.execute(input);

    expect(result).toEqual(createdTransaction);
    expect(tx.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: input.tenantId,
        userId: input.userId,
        accountId: input.accountId,
        categoryId: input.categoryId,
        title: 'Teste financeiro',
        amount: expect.objectContaining({}),
        type: TransactionType.INCOME,
        description: 'Descrição',
      }),
    });

    expect(tx.ledgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: input.tenantId,
        userId: input.userId,
        accountId: input.accountId,
        type: LedgerEntryType.CREDIT,
        referenceId: createdTransaction.id,
        referenceType: LedgerReferenceType.TRANSACTION,
      }),
    });

    expect(tx.account.updateMany).toHaveBeenCalledWith({
      where: {
        id: account.id,
        tenantId: input.tenantId,
        archivedAt: null,
      },
      data: {
        balance: { increment: expect.anything() },
      },
    });
  });

  it('cria despesa, lançamento DEBIT e decrementa o saldo', async () => {
    tx.category.findFirst.mockResolvedValue({
      id: 'category-1',
      type: TransactionType.EXPENSE,
    });

    await useCase.execute({
      ...input,
      type: TransactionType.EXPENSE,
    });

    expect(tx.ledgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: LedgerEntryType.DEBIT,
        referenceType: LedgerReferenceType.TRANSACTION,
      }),
    });

    expect(tx.account.updateMany).toHaveBeenCalledWith({
      where: {
        id: account.id,
        tenantId: input.tenantId,
        archivedAt: null,
      },
      data: {
        balance: { decrement: expect.anything() },
      },
    });
  });

  it('rejeita valores inválidos sem iniciar a transação', async () => {
    await expect(
      useCase.execute({ ...input, amount: '0' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      useCase.execute({ ...input, amount: '-10' }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('não permite acessar conta de outro Espaço', async () => {
    tx.account.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.accountMember.findFirst).not.toHaveBeenCalled();
    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('rejeita usuário sem vínculo ativo com a conta', async () => {
    tx.accountMember.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      ForbiddenException,
    );

    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
  });

  it('rejeita categoria pertencente a outro Espaço ou inexistente', async () => {
    tx.category.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('rejeita categoria com tipo diferente da transação', async () => {
    tx.category.findFirst.mockResolvedValue({
      id: 'category-1',
      type: TransactionType.EXPENSE,
    });

    await expect(useCase.execute(input)).rejects.toThrow(
      BadRequestException,
    );

    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('rejeita subcategoria que não pertence à categoria informada', async () => {
    tx.subCategory.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute({
        ...input,
        subCategoryId: 'subcategory-invalid',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('propaga falha no lançamento sem tentar atualizar o saldo', async () => {
    tx.ledgerEntry.create.mockRejectedValue(
      new Error('Falha ao gravar lançamento'),
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      'Falha ao gravar lançamento',
    );

    expect(tx.transaction.create).toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });

  it('rejeita quando a conta deixa de estar disponível na atualização', async () => {
    tx.account.updateMany.mockResolvedValue({ count: 0 });

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
  });
});
