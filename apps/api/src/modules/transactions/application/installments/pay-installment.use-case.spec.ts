import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { PayInstallmentUseCase } from './pay-installment.use-case';

describe('PayInstallmentUseCase', () => {
  const input = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    installmentPlanId: 'plan-1',
    installmentId: 'installment-1',
    paidAt: '2026-10-25T12:00:00.000Z',
  };

  let tx: any;
  let prisma: any;
  let useCase: PayInstallmentUseCase;

  beforeEach(() => {
    tx = {
      installment: {
        findFirst: jest.fn().mockResolvedValue({
          id: input.installmentId,
          status: 'PENDING',
          transactionId: null,
          installmentNumber: 1,
          amount: new Prisma.Decimal('100.00'),
          plan: {
            id: input.installmentPlanId,
            accountId: 'account-1',
            categoryId: 'category-1',
            subCategoryId: null,
            title: 'Compra parcelada',
            description: null,
            installmentCount: 3,
            deletedAt: null,
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
        findFirst: jest.fn().mockResolvedValue({ id: 'category-1' }),
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

    useCase = new PayInstallmentUseCase(
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
          decrement: new Prisma.Decimal('100.00'),
        },
      },
    });

    expect(tx.installment.updateMany).toHaveBeenCalledTimes(2);
  });

  it('rejeita pagamento duplicado', async () => {
    tx.installment.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(useCase.execute(input)).rejects.toThrow(
      ConflictException,
    );

    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
  });

  it('rejeita parcela de outro Espaço', async () => {
    tx.installment.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      NotFoundException,
    );

    expect(tx.installment.findFirst).toHaveBeenCalledWith({
      where: {
        id: input.installmentId,
        tenantId: input.tenantId,
        installmentPlanId: input.installmentPlanId,
      },
      include: { plan: true },
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

  it('rejeita falha ao atualizar saldo', async () => {
    tx.account.updateMany.mockResolvedValue({ count: 0 });

    await expect(useCase.execute(input)).rejects.toThrow(
      ConflictException,
    );

    expect(tx.installment.updateMany).toHaveBeenCalledTimes(1);
  });

  it('rejeita falha ao vincular transação à parcela', async () => {
    tx.installment.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(useCase.execute(input)).rejects.toThrow(
      ConflictException,
    );
  });
});
