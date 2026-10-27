import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { PayRecurringBillUseCase } from './pay-recurring-bill.use-case';

describe('PayRecurringBillUseCase', () => {
  const input = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    recurringBillId: 'bill-1',
    occurrenceId: 'occurrence-1',
    amount: '150.00',
    paidAt: '2026-10-25T12:00:00.000Z',
  };

  let tx: any;
  let prisma: any;
  let useCase: PayRecurringBillUseCase;

  beforeEach(() => {
    tx = {
      recurringBillOccurrence: {
        findFirst: jest.fn().mockResolvedValue({
          id: input.occurrenceId,
          status: 'PENDING',
          transactionId: null,
          recurringBill: {
            id: input.recurringBillId,
            accountId: 'account-1',
            categoryId: 'category-1',
            subCategoryId: null,
            title: 'Conta de energia',
            description: null,
          },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: 'account-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      accountMember: {
        findFirst: jest.fn().mockResolvedValue({ role: 'OWNER' }),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'category-1',
          type: 'EXPENSE',
        }),
      },
      subCategory: {
        findFirst: jest.fn(),
      },
      transaction: {
        create: jest.fn().mockResolvedValue({ id: 'transaction-1' }),
      },
      ledgerEntry: {
        create: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
      },
    };

    prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    };

    useCase = new PayRecurringBillUseCase(
      prisma as PrismaService,
    );
  });

  it('registra pagamento, Ledger e débito no saldo', async () => {
    const result = await useCase.execute(input);

    expect(result.transactionId).toBe('transaction-1');
    expect(result.status).toBe('PAID');

    expect(tx.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: input.tenantId,
        accountId: 'account-1',
        type: 'EXPENSE',
        amount: new Prisma.Decimal('150.00'),
      }),
    });

    expect(tx.ledgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: input.tenantId,
        type: 'DEBIT',
        referenceId: 'transaction-1',
        referenceType: 'TRANSACTION',
      }),
    });

    expect(tx.account.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'account-1',
        tenantId: input.tenantId,
        archivedAt: null,
      },
      data: {
        balance: {
          decrement: new Prisma.Decimal('150.00'),
        },
      },
    });

    expect(tx.recurringBillOccurrence.updateMany)
      .toHaveBeenCalledTimes(2);
  });

  it('rejeita pagamento duplicado', async () => {
    tx.recurringBillOccurrence.updateMany
      .mockResolvedValueOnce({ count: 0 });

    await expect(useCase.execute(input)).rejects.toThrow(
      ConflictException,
    );

    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('rejeita vencimento de outro Espaço', async () => {
    tx.recurringBillOccurrence.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      NotFoundException,
    );

    expect(tx.recurringBillOccurrence.findFirst).toHaveBeenCalledWith({
      where: {
        id: input.occurrenceId,
        tenantId: input.tenantId,
        recurringBillId: input.recurringBillId,
      },
      include: { recurringBill: true },
    });

    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('impede pagamento por usuário VIEWER', async () => {
    tx.accountMember.findFirst.mockResolvedValue({
      role: 'VIEWER',
    });

    await expect(useCase.execute(input)).rejects.toThrow(
      ForbiddenException,
    );

    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('rejeita valor inválido antes da transação', async () => {
    await expect(
      useCase.execute({ ...input, amount: '0' }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita falha ao atualizar saldo', async () => {
    tx.account.updateMany.mockResolvedValue({ count: 0 });

    await expect(useCase.execute(input)).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejeita falha ao vincular transação ao vencimento', async () => {
    tx.recurringBillOccurrence.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(useCase.execute(input)).rejects.toThrow(
      ConflictException,
    );
  });
});
