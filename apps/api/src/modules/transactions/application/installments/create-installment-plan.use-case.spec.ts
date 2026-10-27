import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import {
  calculateInstallmentDueDate,
  CreateInstallmentPlanUseCase,
} from './create-installment-plan.use-case';

describe('CreateInstallmentPlanUseCase', () => {
  let useCase: CreateInstallmentPlanUseCase;
  let prisma: { $transaction: jest.Mock };
  let tx: {
    account: { findFirst: jest.Mock; updateMany: jest.Mock };
    accountMember: { findFirst: jest.Mock };
    category: { findFirst: jest.Mock };
    subCategory: { findFirst: jest.Mock };
    installmentPlan: { create: jest.Mock; findFirstOrThrow: jest.Mock };
    installment: { createMany: jest.Mock };
    transaction: { create: jest.Mock };
    ledgerEntry: { create: jest.Mock };
  };

  const input = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    accountId: 'account-1',
    categoryId: 'category-1',
    title: ' Compra parcelada ',
    totalAmount: '100.00',
    purchaseDate: '2026-10-22T12:00:00.000Z',
    installmentCount: 3,
    firstDueDate: '2026-11-30T12:00:00.000Z',
    description: ' Planejamento ',
  };

  const createdPlan = {
    id: 'plan-1',
    tenantId: 'tenant-1',
    totalAmount: '100.00',
    installments: [
      { installmentNumber: 1, amount: '33.33' },
      { installmentNumber: 2, amount: '33.33' },
      { installmentNumber: 3, amount: '33.34' },
    ],
  };

  beforeEach(() => {
    tx = {
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: 'account-1' }),
        updateMany: jest.fn(),
      },
      accountMember: {
        findFirst: jest.fn().mockResolvedValue({ id: 'member-1' }),
      },
      category: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'category-1',
          type: 'EXPENSE',
        }),
      },
      subCategory: {
        findFirst: jest.fn().mockResolvedValue({ id: 'subcategory-1' }),
      },
      installmentPlan: {
        create: jest.fn().mockResolvedValue({ id: 'plan-1' }),
        findFirstOrThrow: jest.fn().mockResolvedValue(createdPlan),
      },
      installment: { createMany: jest.fn().mockResolvedValue({ count: 3 }) },
      transaction: { create: jest.fn() },
      ledgerEntry: { create: jest.fn() },
    };

    prisma = {
      $transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    useCase = new CreateInstallmentPlanUseCase(
      prisma as unknown as PrismaService,
    );
  });

  it('cria somente o planejamento e distribui o valor em centavos', async () => {
    const result = await useCase.execute(input);

    expect(result).toEqual(createdPlan);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.installmentPlan.create).toHaveBeenCalledTimes(1);
    expect(tx.installment.createMany).toHaveBeenCalledTimes(1);
    expect(tx.installmentPlan.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: 'plan-1', tenantId: input.tenantId },
      include: { installments: { orderBy: { installmentNumber: 'asc' } } },
    });

    const createArgs = tx.installmentPlan.create.mock.calls[0][0];
    const installments = tx.installment.createMany.mock.calls[0][0].data;

    expect(createArgs.data).toEqual(
      expect.objectContaining({
        tenantId: input.tenantId,
        userId: input.userId,
        accountId: input.accountId,
        categoryId: input.categoryId,
        title: 'Compra parcelada',
        description: 'Planejamento',
      }),
    );
    expect(installments).toHaveLength(3);
    expect(installments[0]).toEqual(expect.objectContaining({
      tenantId: input.tenantId,
      installmentPlanId: 'plan-1',
    }));
    expect(installments.map((item: { installmentNumber: number }) =>
      item.installmentNumber,
    )).toEqual([1, 2, 3]);
    expect(installments.map((item: { amount: { toFixed: (n: number) => string } }) =>
      item.amount.toFixed(2),
    )).toEqual(['33.33', '33.33', '33.34']);

    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });

  it('rejeita valor ou quantidade de parcelas inválidos antes da transação', async () => {
    await expect(
      useCase.execute({ ...input, totalAmount: '0' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      useCase.execute({ ...input, installmentCount: 1 }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('não permite usar conta de outro Espaço ou inexistente', async () => {
    tx.account.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.account.findFirst).toHaveBeenCalledWith({
      where: {
        id: input.accountId,
        tenantId: input.tenantId,
        archivedAt: null,
      },
    });
    expect(tx.accountMember.findFirst).not.toHaveBeenCalled();
    expect(tx.installmentPlan.create).not.toHaveBeenCalled();
  });

  it('rejeita usuário sem vínculo ativo com a conta', async () => {
    tx.accountMember.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    expect(tx.installmentPlan.create).not.toHaveBeenCalled();
  });

  it('não permite usar categoria de outro Espaço ou inexistente', async () => {
    tx.category.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.category.findFirst).toHaveBeenCalledWith({
      where: {
        id: input.categoryId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });
    expect(tx.installmentPlan.create).not.toHaveBeenCalled();
  });

  it('rejeita categoria que não seja de despesa', async () => {
    tx.category.findFirst.mockResolvedValue({
      id: 'category-1',
      type: 'INCOME',
    });

    await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    expect(tx.installmentPlan.create).not.toHaveBeenCalled();
  });

  it('rejeita subcategoria que não pertence à categoria informada', async () => {
    tx.subCategory.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute({ ...input, subCategoryId: 'subcategory-invalid' }),
    ).rejects.toThrow(NotFoundException);
    expect(tx.installmentPlan.create).not.toHaveBeenCalled();
  });
});

describe('calculateInstallmentDueDate', () => {
  it('limita o dia 31 em fevereiro e retorna ao dia 31 em março', () => {
    const first = new Date('2027-01-31T12:00:00.000Z');

    expect(calculateInstallmentDueDate(first, 1).toISOString())
      .toBe('2027-02-28T12:00:00.000Z');
    expect(calculateInstallmentDueDate(first, 2).toISOString())
      .toBe('2027-03-31T12:00:00.000Z');
  });

  it('respeita o dia 29 de fevereiro em ano bissexto', () => {
    const first = new Date('2028-01-29T10:30:00.000Z');

    expect(calculateInstallmentDueDate(first, 1).toISOString())
      .toBe('2028-02-29T10:30:00.000Z');
    expect(calculateInstallmentDueDate(first, 2).toISOString())
      .toBe('2028-03-29T10:30:00.000Z');
  });
});
