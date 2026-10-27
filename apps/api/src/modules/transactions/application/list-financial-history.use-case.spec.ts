import { LedgerReferenceType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ListFinancialHistoryUseCase } from './list-financial-history.use-case';

describe('ListFinancialHistoryUseCase', () => {
  let useCase: ListFinancialHistoryUseCase;
  let transactionFindMany: jest.Mock;
  let transferFindMany: jest.Mock;
  let ledgerFindMany: jest.Mock;
  let prisma: {
    transaction: { findMany: jest.Mock };
    transfer: { findMany: jest.Mock };
    ledgerEntry: { findMany: jest.Mock };
  };

  beforeEach(() => {
    transactionFindMany = jest.fn().mockResolvedValue([]);
    transferFindMany = jest.fn().mockResolvedValue([]);
    ledgerFindMany = jest.fn().mockResolvedValue([]);

    prisma = {
      transaction: { findMany: transactionFindMany },
      transfer: { findMany: transferFindMany },
      ledgerEntry: { findMany: ledgerFindMany },
    };

    useCase = new ListFinancialHistoryUseCase(
      prisma as unknown as PrismaService,
    );
  });

  it('filtra transações pelo Espaço e vínculo ativo do usuário', async () => {
    await useCase.execute('tenant-1', 'user-1');

    expect(transactionFindMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        account: {
          accountMembers: {
            some: { userId: 'user-1', status: 'ACTIVE' },
          },
        },
      },
      include: {
        account: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });
  });

  it('exige acesso ativo às contas de origem e destino da transferência', async () => {
    await useCase.execute('tenant-1', 'user-1');

    expect(transferFindMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        fromAccount: {
          accountMembers: {
            some: { userId: 'user-1', status: 'ACTIVE' },
          },
        },
        toAccount: {
          accountMembers: {
            some: { userId: 'user-1', status: 'ACTIVE' },
          },
        },
      },
      include: {
        fromAccount: { select: { id: true, name: true } },
        toAccount: { select: { id: true, name: true } },
      },
    });
  });

  it('consulta lançamentos originais apenas no Espaço e nas operações retornadas', async () => {
    transactionFindMany.mockResolvedValue([
      {
        id: 'transaction-1',
        title: 'Transação de teste',
        description: null,
        date: new Date('2026-10-20T12:00:00.000Z'),
        amount: { toString: () => '100' },
        type: 'EXPENSE',
        deletedAt: null,
        account: { id: 'account-1', name: 'Conta' },
        category: { id: 'category-1', name: 'Categoria' },
      },
    ]);
    transferFindMany.mockResolvedValue([
      {
        id: 'transfer-1',
        description: 'Transferência de teste',
        createdAt: new Date('2026-10-20T13:00:00.000Z'),
        amount: { toString: () => '200' },
        deletedAt: null,
        fromAccount: { id: 'account-1', name: 'Origem' },
        toAccount: { id: 'account-2', name: 'Destino' },
      },
    ]);

    await useCase.execute('tenant-1', 'user-1');

    expect(ledgerFindMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        OR: [
          {
            referenceType: LedgerReferenceType.TRANSACTION,
            referenceId: { in: ['transaction-1'] },
          },
          {
            referenceType: LedgerReferenceType.TRANSFER,
            referenceId: { in: ['transfer-1'] },
          },
        ],
      },
      select: {
        referenceId: true,
        referenceType: true,
        reversedAt: true,
      },
    });
  });

  it('retorna transação concluída quando existe lançamento não estornado', async () => {
    transactionFindMany.mockResolvedValue([
      {
        id: 'transaction-1',
        title: 'Salário',
        description: null,
        date: new Date('2026-10-20T12:00:00.000Z'),
        amount: { toString: () => '5000' },
        type: 'INCOME',
        deletedAt: null,
        account: { id: 'account-1', name: 'Conta principal' },
        category: { id: 'category-1', name: 'Salário' },
      },
    ]);
    ledgerFindMany.mockResolvedValue([
      {
        referenceId: 'transaction-1',
        referenceType: LedgerReferenceType.TRANSACTION,
        reversedAt: null,
      },
    ]);

    const result = await useCase.execute('tenant-1', 'user-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'transaction-1',
      operationType: 'TRANSACTION',
      status: 'COMPLETED',
      direction: 'INCOME',
      accountName: 'Conta principal',
      categoryName: 'Salário',
    });
  });

  it('mantém transação excluída quando o lançamento original foi estornado', async () => {
    transactionFindMany.mockResolvedValue([
      {
        id: 'transaction-1',
        title: 'Compra',
        description: null,
        date: new Date('2026-10-20T12:00:00.000Z'),
        amount: { toString: () => '100' },
        type: 'EXPENSE',
        deletedAt: new Date('2026-10-21T12:00:00.000Z'),
        account: { id: 'account-1', name: 'Conta principal' },
        category: { id: 'category-1', name: 'Compras' },
      },
    ]);
    ledgerFindMany.mockResolvedValue([
      {
        referenceId: 'transaction-1',
        referenceType: LedgerReferenceType.TRANSACTION,
        reversedAt: new Date('2026-10-21T12:00:00.000Z'),
      },
    ]);

    const result = await useCase.execute('tenant-1', 'user-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'transaction-1',
      status: 'REVERSED',
      direction: 'EXPENSE',
    });
  });

  it('não exibe transação excluída sem estorno', async () => {
    transactionFindMany.mockResolvedValue([
      {
        id: 'transaction-1',
        title: 'Compra',
        description: null,
        date: new Date('2026-10-20T12:00:00.000Z'),
        amount: { toString: () => '100' },
        type: 'EXPENSE',
        deletedAt: new Date('2026-10-21T12:00:00.000Z'),
        account: { id: 'account-1', name: 'Conta principal' },
        category: { id: 'category-1', name: 'Compras' },
      },
    ]);

    const result = await useCase.execute('tenant-1', 'user-1');

    expect(result).toEqual([]);
  });

  it('marca transferência como estornada quando os dois lançamentos originais foram estornados', async () => {
    transferFindMany.mockResolvedValue([
      {
        id: 'transfer-1',
        description: 'Transferência',
        createdAt: new Date('2026-10-20T12:00:00.000Z'),
        amount: { toString: () => '250' },
        deletedAt: new Date('2026-10-21T12:00:00.000Z'),
        fromAccount: { id: 'account-1', name: 'Origem' },
        toAccount: { id: 'account-2', name: 'Destino' },
      },
    ]);
    ledgerFindMany.mockResolvedValue([
      {
        referenceId: 'transfer-1',
        referenceType: LedgerReferenceType.TRANSFER,
        reversedAt: new Date('2026-10-21T12:00:00.000Z'),
      },
      {
        referenceId: 'transfer-1',
        referenceType: LedgerReferenceType.TRANSFER,
        reversedAt: new Date('2026-10-21T12:00:00.000Z'),
      },
    ]);

    const result = await useCase.execute('tenant-1', 'user-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'transfer-1',
      operationType: 'TRANSFER',
      status: 'REVERSED',
      fromAccountName: 'Origem',
      toAccountName: 'Destino',
    });
  });

  it('ordena operações por data decrescente', async () => {
    transactionFindMany.mockResolvedValue([
      {
        id: 'transaction-old',
        title: 'Antiga',
        description: null,
        date: new Date('2026-10-10T12:00:00.000Z'),
        amount: { toString: () => '10' },
        type: 'EXPENSE',
        deletedAt: null,
        account: { id: 'account-1', name: 'Conta' },
        category: { id: 'category-1', name: 'Categoria' },
      },
    ]);
    transferFindMany.mockResolvedValue([
      {
        id: 'transfer-new',
        description: 'Nova',
        createdAt: new Date('2026-10-20T12:00:00.000Z'),
        amount: { toString: () => '20' },
        deletedAt: null,
        fromAccount: { id: 'account-1', name: 'Origem' },
        toAccount: { id: 'account-2', name: 'Destino' },
      },
    ]);

    const result = await useCase.execute('tenant-1', 'user-1');

    expect(result.map((item) => item.id)).toEqual([
      'transfer-new',
      'transaction-old',
    ]);
  });
});
