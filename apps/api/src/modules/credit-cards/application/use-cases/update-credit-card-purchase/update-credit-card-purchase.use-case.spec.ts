import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import {
  UpdateCreditCardPurchaseInput,
  UpdateCreditCardPurchaseUseCase,
} from './update-credit-card-purchase.use-case';

describe('UpdateCreditCardPurchaseUseCase', () => {
  let useCase: UpdateCreditCardPurchaseUseCase;
  let prisma: { $transaction: jest.Mock };
  let tenantMembers: { findByTenantAndUser: jest.Mock };

  let tx: {
    creditCardPurchase: {
      findFirst: jest.Mock;
      update: jest.Mock;
      findFirstOrThrow: jest.Mock;
    };
    creditCardInvoice: { upsert: jest.Mock };
    creditCardInstallment: {
      deleteMany: jest.Mock;
      createMany: jest.Mock;
      aggregate: jest.Mock;
    };
    financialObligation: {
      findMany: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
  };

  const input: UpdateCreditCardPurchaseInput = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    creditCardId: 'card-1',
    purchaseId: 'purchase-1',
    totalAmount: '1200.00',
    installmentCount: 2,
  };

  const makePurchase = (invoiceStatus = 'OPEN') => ({
    id: 'purchase-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    creditCardId: 'card-1',
    purchaseDate: new Date('2026-11-10T12:00:00.000Z'),
    totalAmount: new Prisma.Decimal('100.00'),
    installmentCount: 3,
    creditCard: {
      id: 'card-1',
      name: 'Cartão principal',
      closingDay: 20,
      dueDay: 10,
    },
    installments: [0, 1, 2].map((index) => {
      const referenceMonth = new Date(Date.UTC(2026, 10 + index, 1));

      return {
        id: `old-installment-${index + 1}`,
        invoiceId: `old-invoice-${index + 1}`,
        installmentNumber: index + 1,
        dueDate: new Date(Date.UTC(2026, 11 + index, 10)),
        invoice: {
          id: `old-invoice-${index + 1}`,
          status: invoiceStatus,
          dueDate: new Date(Date.UTC(2026, 11 + index, 10)),
          referenceMonth,
        },
      };
    }),
  });

  beforeEach(() => {
    tenantMembers = {
      findByTenantAndUser: jest.fn().mockResolvedValue({
        status: 'ACTIVE',
        role: 'MEMBER',
      }),
    };

    const purchase = makePurchase();

    tx = {
      creditCardPurchase: {
        findFirst: jest.fn().mockResolvedValue(purchase),
        update: jest.fn().mockResolvedValue({ id: 'purchase-1' }),
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 'purchase-1',
          totalAmount: new Prisma.Decimal('1200.00'),
          installmentCount: 2,
          installments: [],
        }),
      },
      creditCardInvoice: {
        upsert: jest.fn().mockImplementation(async ({ where }) => {
          const referenceMonth =
            where.tenantId_creditCardId_referenceMonth.referenceMonth;

          return {
            id: `new-invoice-${referenceMonth.toISOString()}`,
            status: 'OPEN',
            dueDate: new Date(
              Date.UTC(
                referenceMonth.getUTCFullYear(),
                referenceMonth.getUTCMonth() + 1,
                10,
              ),
            ),
            referenceMonth,
          };
        }),
      },
      creditCardInstallment: {
        deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
        aggregate: jest.fn().mockImplementation(async ({ where }) => {
          const installments =
            tx.creditCardInstallment.createMany.mock.calls[0][0].data ?? [];

          const amount = installments
            .filter(
              (item: { invoiceId: string }) =>
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
        findMany: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue({ id: 'obligation-1' }),
        update: jest.fn().mockResolvedValue({ id: 'obligation-1' }),
        create: jest.fn().mockResolvedValue({ id: 'obligation-1' }),
      },
    };

    prisma = {
      $transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    useCase = new UpdateCreditCardPurchaseUseCase(
      prisma as unknown as PrismaService,
      tenantMembers as unknown as TenantMemberRepository,
    );
  });

  it('atualiza o valor total e redistribui as parcelas', async () => {
    const result = await useCase.execute(input);

    expect(result).toEqual(
      expect.objectContaining({
        id: 'purchase-1',
        installmentCount: 2,
      }),
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.creditCardPurchase.findFirst).toHaveBeenCalledTimes(1);
    expect(tx.creditCardInstallment.deleteMany).toHaveBeenCalledTimes(1);
    expect(tx.creditCardInstallment.createMany).toHaveBeenCalledTimes(1);

    const installments =
      tx.creditCardInstallment.createMany.mock.calls[0][0].data;

    expect(installments).toHaveLength(2);
    expect(
      installments.map((item: { amount: Prisma.Decimal }) =>
        item.amount.toFixed(2),
      ),
    ).toEqual(['600.00', '600.00']);

    expect(
      installments.map(
        (item: { installmentNumber: number }) => item.installmentNumber,
      ),
    ).toEqual([1, 2]);

    expect(tx.creditCardPurchase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'purchase-1' },
        data: expect.objectContaining({
          totalAmount: expect.any(Prisma.Decimal),
          installmentCount: 2,
        }),
      }),
    );

    expect(tx.financialObligation.findMany).toHaveBeenCalledTimes(1);
    expect(tx.financialObligation.create).toHaveBeenCalled();
  });

  it('não permite edição por usuário diferente do criador', async () => {
    tx.creditCardPurchase.findFirst.mockResolvedValue({
      ...makePurchase(),
      userId: 'another-user',
    });

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);

    expect(tx.creditCardInstallment.deleteMany).not.toHaveBeenCalled();
    expect(tx.creditCardPurchase.update).not.toHaveBeenCalled();
  });

  it('não permite edição depois do vencimento da primeira parcela', async () => {
    const purchase = makePurchase();

    purchase.installments[0].dueDate = new Date('2026-11-01T00:00:00.000Z');

    tx.creditCardPurchase.findFirst.mockResolvedValue(purchase);

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

    expect(tx.creditCardInstallment.deleteMany).not.toHaveBeenCalled();
  });

  it('não permite edição quando uma fatura antiga está fechada', async () => {
    tx.creditCardPurchase.findFirst.mockResolvedValue(makePurchase('CLOSED'));

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

    expect(tx.creditCardInvoice.upsert).not.toHaveBeenCalled();
    expect(tx.creditCardInstallment.deleteMany).not.toHaveBeenCalled();
  });

  it('não permite edição quando uma nova fatura calculada não está aberta', async () => {
    tx.creditCardInvoice.upsert.mockImplementation(async ({ where }) => {
      const referenceMonth =
        where.tenantId_creditCardId_referenceMonth.referenceMonth;

      return {
        id: 'closed-invoice',
        status: 'CLOSED',
        dueDate: new Date('2026-12-10T00:00:00.000Z'),
        referenceMonth,
      };
    });

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

    expect(tx.creditCardInstallment.deleteMany).not.toHaveBeenCalled();
  });

  it('não permite edição quando uma obrigação já foi liquidada', async () => {
    tx.financialObligation.findMany.mockResolvedValue([
      {
        id: 'obligation-1',
        sourceId: 'old-invoice-1',
        status: 'PARTIALLY_SETTLED',
        settlements: [{ id: 'settlement-1' }],
      },
    ]);

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

    expect(tx.creditCardInstallment.deleteMany).not.toHaveBeenCalled();
    expect(tx.creditCardPurchase.update).not.toHaveBeenCalled();
  });

  it('rejeita valor ou quantidade de parcelas inválidos antes da transação', async () => {
    await expect(
      useCase.execute({
        ...input,
        totalAmount: '0.00',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      useCase.execute({
        ...input,
        installmentCount: 121,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('não permite editar compra sem parcelas', async () => {
    tx.creditCardPurchase.findFirst.mockResolvedValue({
      ...makePurchase(),
      installments: [],
    });

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

    expect(tx.creditCardInstallment.deleteMany).not.toHaveBeenCalled();
  });
});
