import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import {
  CreateCreditCardPurchaseInput,
  CreateCreditCardPurchaseUseCase,
} from './create-credit-card-purchase.use-case';

describe('CreateCreditCardPurchaseUseCase', () => {
  let useCase: CreateCreditCardPurchaseUseCase;
  let prisma: { $transaction: jest.Mock };
  let tenantMembers: { findByTenantAndUser: jest.Mock };

  let tx: {
    creditCard: { findFirst: jest.Mock };
    category: { findFirst: jest.Mock };
    subCategory: { findFirst: jest.Mock };
    creditCardPurchase: {
      create: jest.Mock;
      findFirstOrThrow: jest.Mock;
    };
    creditCardInvoice: { upsert: jest.Mock };
    creditCardInstallment: { createMany: jest.Mock };
    transaction: { create: jest.Mock };
    ledgerEntry: { create: jest.Mock };
    account: { updateMany: jest.Mock };
  };

  const input: CreateCreditCardPurchaseInput = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    creditCardId: 'card-1',
    categoryId: 'category-1',
    title: 'Compra parcelada',
    totalAmount: '100.00',
    purchaseDate: '2026-11-20T12:00:00.000Z',
    installmentCount: 3,
    description: 'Compra de teste',
  };

  const createdPurchase = {
    id: 'purchase-1',
    tenantId: 'tenant-1',
    title: 'Compra parcelada',
    totalAmount: new Prisma.Decimal('100.00'),
    installments: [],
  };

  beforeEach(() => {
    tenantMembers = {
      findByTenantAndUser: jest.fn().mockResolvedValue({
        status: 'ACTIVE',
        role: 'MEMBER',
      }),
    };

    tx = {
      creditCard: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'card-1',
          closingDay: 20,
          dueDay: 10,
        }),
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
      creditCardPurchase: {
        create: jest.fn().mockResolvedValue({ id: 'purchase-1' }),
        findFirstOrThrow: jest.fn().mockResolvedValue(createdPurchase),
      },
      creditCardInvoice: {
        upsert: jest.fn().mockImplementation(async ({ where }) => {
          const referenceMonth =
            where.tenantId_creditCardId_referenceMonth.referenceMonth;

          return {
            id: referenceMonth.toISOString(),
            status: 'OPEN',
            dueDate: new Date(
              Date.UTC(
                referenceMonth.getUTCFullYear(),
                referenceMonth.getUTCMonth() + 1,
                10,
              ),
            ),
          };
        }),
      },
      creditCardInstallment: {
        createMany: jest.fn().mockResolvedValue({ count: 3 }),
        aggregate: jest.fn().mockImplementation(async ({ where }) => {
          const installments =
            tx.creditCardInstallment.createMany.mock.calls[0][0].data;

          const amount = installments
            .filter((item: { invoiceId: string }) =>
              item.invoiceId === where.invoiceId,
            )
            .reduce(
              (total: Prisma.Decimal, item: { amount: Prisma.Decimal }) =>
                total.plus(item.amount),
              new Prisma.Decimal(0),
            );

          return { _sum: { amount } };
        }),
      },
      financialObligation: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'obligation-1' }),
        update: jest.fn().mockResolvedValue({ id: 'obligation-1' }),
      },
      transaction: { create: jest.fn() },
      ledgerEntry: { create: jest.fn() },
      account: { updateMany: jest.fn() },
    };

    prisma = {
      $transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    useCase = new CreateCreditCardPurchaseUseCase(
      prisma as unknown as PrismaService,
      tenantMembers as unknown as TenantMemberRepository,
    );
  });

  it('cria compra, faturas e parcelas na mesma transação', async () => {
    const result = await useCase.execute(input);

    expect(result).toEqual(createdPurchase);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.creditCardPurchase.create).toHaveBeenCalledTimes(1);
    expect(tx.creditCardInvoice.upsert).toHaveBeenCalledTimes(3);
    expect(tx.creditCardInstallment.createMany).toHaveBeenCalledTimes(1);

    expect(tx.creditCardInstallment.aggregate).toHaveBeenCalledTimes(3);
    expect(tx.financialObligation.findUnique).toHaveBeenCalledTimes(3);
    expect(tx.financialObligation.create).toHaveBeenCalledTimes(3);
    expect(tx.financialObligation.update).not.toHaveBeenCalled();

    const expectedDueDates = [
      '2026-12-10T00:00:00.000Z',
      '2027-01-10T00:00:00.000Z',
      '2027-02-10T00:00:00.000Z',
    ];

    const createdInstallments =
      tx.creditCardInstallment.createMany.mock.calls[0][0].data;

    expect(
      createdInstallments.map((item: { dueDate: Date }) =>
        item.dueDate.toISOString(),
      ),
    ).toEqual(expectedDueDates);

    const purchaseData = tx.creditCardPurchase.create.mock.calls[0][0].data;

    expect(purchaseData).toEqual(
      expect.objectContaining({
        tenantId: input.tenantId,
        userId: input.userId,
        creditCardId: input.creditCardId,
        categoryId: input.categoryId,
        title: 'Compra parcelada',
        totalAmount: expect.any(Prisma.Decimal),
      }),
    );

    const installments =
      tx.creditCardInstallment.createMany.mock.calls[0][0].data;

    expect(installments).toHaveLength(3);
    expect(
      installments.map((item: { installmentNumber: number }) =>
        item.installmentNumber,
      ),
    ).toEqual([1, 2, 3]);

    expect(
      installments.map((item: { amount: Prisma.Decimal }) =>
        item.amount.toFixed(2),
      ),
    ).toEqual(['33.34', '33.33', '33.33']);

    expect(
      installments.map((item: { dueDate: Date }) =>
        item.dueDate.toISOString(),
      ),
    ).toEqual([
      '2026-12-10T00:00:00.000Z',
      '2027-01-10T00:00:00.000Z',
      '2027-02-10T00:00:00.000Z',
    ]);

    const invoiceMonths = tx.creditCardInvoice.upsert.mock.calls.map(
      (call: {
        0: {
          create: { referenceMonth: Date };
        };
      }) => call[0].create.referenceMonth.toISOString(),
    );

    expect(invoiceMonths).toEqual([
      '2026-11-01T00:00:00.000Z',
      '2026-12-01T00:00:00.000Z',
      '2027-01-01T00:00:00.000Z',
    ]);

    expect(tx.transaction.create).not.toHaveBeenCalled();
    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.account.updateMany).not.toHaveBeenCalled();

    const obligations =
      tx.financialObligation.create.mock.calls.map((call: any[]) => call[0].data);

    expect(obligations).toHaveLength(3);

    expect(
      obligations.map((item: { dueDate: Date }) =>
        item.dueDate.toISOString(),
      ),
    ).toEqual(expectedDueDates);

    expect(obligations.map((item: { amount: Prisma.Decimal }) =>
      item.amount.toFixed(2),
    )).toEqual(['33.34', '33.33', '33.33']);

    expect(obligations[0]).toEqual(
      expect.objectContaining({
        tenantId: input.tenantId,
        userId: input.userId,
        accountId: null,
        categoryId: null,
        subCategoryId: null,
        type: 'PAYABLE',
        status: 'PENDING',
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: expect.any(String),
      }),
    );

    expect(
      new Set(obligations.map((item: { sourceId: string }) => item.sourceId))
        .size,
    ).toBe(3);
  });

  it('atualiza a obrigação pendente existente sem duplicá-la', async () => {
    tx.financialObligation.findUnique
      .mockResolvedValueOnce({
        id: 'existing-obligation',
        status: 'PENDING',
      })
      .mockResolvedValue(null);

    await useCase.execute(input);

    expect(tx.financialObligation.update).toHaveBeenCalledTimes(1);
    expect(tx.financialObligation.create).toHaveBeenCalledTimes(2);

    expect(tx.financialObligation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'existing-obligation' },
        data: expect.objectContaining({
          accountId: null,
          categoryId: null,
          type: 'PAYABLE',
          amount: expect.any(Prisma.Decimal),
        }),
      }),
    );
  });

  it('não altera obrigação de fatura que já saiu do estado pendente', async () => {
    tx.financialObligation.findUnique.mockResolvedValue({
      id: 'settled-obligation',
      status: 'PARTIALLY_SETTLED',
    });

    await expect(useCase.execute(input)).rejects.toThrow(
      BadRequestException,
    );

    expect(tx.financialObligation.update).not.toHaveBeenCalled();
    expect(tx.creditCardInstallment.createMany).toHaveBeenCalledTimes(1);
  });

  it('rejeita usuário sem vínculo ativo com o Tenant', async () => {
    tenantMembers.findByTenantAndUser.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('não permite que um membro VIEWER registre compras', async () => {
    tenantMembers.findByTenantAndUser.mockResolvedValue({
      status: 'ACTIVE',
      role: 'VIEWER',
    });

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita cartão inexistente, de outro Tenant ou arquivado', async () => {
    tx.creditCard.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

    expect(tx.creditCard.findFirst).toHaveBeenCalledWith({
      where: {
        id: input.creditCardId,
        tenantId: input.tenantId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        closingDay: true,
        dueDay: true,
      },
    });

    expect(tx.creditCardPurchase.create).not.toHaveBeenCalled();
  });

  it('rejeita categoria inexistente ou de outro Tenant', async () => {
    tx.category.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.creditCardPurchase.create).not.toHaveBeenCalled();
  });

  it('rejeita categoria que não seja do tipo despesa', async () => {
    tx.category.findFirst.mockResolvedValue({
      id: 'category-1',
      type: 'INCOME',
    });

    await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    expect(tx.creditCardPurchase.create).not.toHaveBeenCalled();
  });

  it('rejeita subcategoria que não pertence à categoria informada', async () => {
    tx.subCategory.findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute({
        ...input,
        subCategoryId: 'subcategory-invalid',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(tx.creditCardPurchase.create).not.toHaveBeenCalled();
  });

  it('não permite inserir compra em fatura fechada ou paga', async () => {
    tx.creditCardInvoice.upsert.mockResolvedValue({
      id: 'invoice-closed',
      status: 'CLOSED',
    });

    await expect(useCase.execute(input)).rejects.toThrow(BadRequestException);
    expect(tx.creditCardInstallment.createMany).not.toHaveBeenCalled();
  });

  it('rejeita valor e quantidade de parcelas inválidos antes da transação', async () => {
    await expect(
      useCase.execute({ ...input, totalAmount: '0.00' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      useCase.execute({ ...input, installmentCount: 121 }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita data de compra inválida antes da transação', async () => {
    await expect(
      useCase.execute({ ...input, purchaseDate: 'data-invalida' }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
