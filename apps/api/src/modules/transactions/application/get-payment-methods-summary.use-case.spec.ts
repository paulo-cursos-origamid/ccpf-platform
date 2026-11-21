import {
  FinancialPaymentMethod,
  Prisma,
  TransactionType,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { GetPaymentMethodsSummaryUseCase } from './get-payment-methods-summary.use-case';

describe('GetPaymentMethodsSummaryUseCase', () => {
  let useCase: GetPaymentMethodsSummaryUseCase;

  let prisma: {
    transaction: { groupBy: jest.Mock };
    financialObligationSettlement: { groupBy: jest.Mock };
    creditCardInstallment: { aggregate: jest.Mock };
  };

  const input = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    month: '2026-11',
  };

  beforeEach(() => {
    prisma = {
      transaction: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
      financialObligationSettlement: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
      creditCardInstallment: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { amount: null },
        }),
      },
    };

    useCase = new GetPaymentMethodsSummaryUseCase(
      prisma as unknown as PrismaService,
    );
  });

  it('soma despesas comuns, liquidações e parcelas de cartão', async () => {
    prisma.transaction.groupBy.mockResolvedValue([
      {
        paymentMethod: FinancialPaymentMethod.PIX,
        _sum: { amount: new Prisma.Decimal('100.00') },
      },
    ]);

    prisma.financialObligationSettlement.groupBy.mockResolvedValue([
      {
        paymentMethod: FinancialPaymentMethod.CASH,
        _sum: { settledAmount: new Prisma.Decimal('50.00') },
      },
    ]);

    prisma.creditCardInstallment.aggregate.mockResolvedValue({
      _sum: { amount: new Prisma.Decimal('150.00') },
    });

    const result = await useCase.execute(input);

    expect(result).toEqual({
      month: '2026-11',
      totalAmount: 300,
      methods: [
        {
          paymentMethod: FinancialPaymentMethod.CREDIT_CARD,
          totalAmount: 150,
          percentage: 50,
        },
        {
          paymentMethod: FinancialPaymentMethod.PIX,
          totalAmount: 100,
          percentage: 33.33,
        },
        {
          paymentMethod: FinancialPaymentMethod.CASH,
          totalAmount: 50,
          percentage: 16.67,
        },
      ],
    });
  });

  it('filtra transações já vinculadas a uma liquidação', async () => {
    await useCase.execute(input);

    expect(prisma.transaction.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['paymentMethod'],
        where: expect.objectContaining({
          tenantId: input.tenantId,
          userId: input.userId,
          type: TransactionType.EXPENSE,
          deletedAt: null,
          financialObligationSettlement: { is: null },
        }),
      }),
    );
  });

  it('considera somente liquidações de obrigações a pagar que não sejam faturas', async () => {
    await useCase.execute(input);

    expect(
      prisma.financialObligationSettlement.groupBy,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['paymentMethod'],
        where: expect.objectContaining({
          tenantId: input.tenantId,
          userId: input.userId,
          obligation: {
            is: {
              type: 'PAYABLE',
              sourceType: { not: 'CREDIT_CARD_INVOICE' },
            },
          },
        }),
      }),
    );
  });

  it('considera parcelas pela competência da fatura e pelo usuário da compra', async () => {
    await useCase.execute(input);

    expect(prisma.creditCardInstallment.aggregate).toHaveBeenCalledWith({
      where: {
        tenantId: input.tenantId,
        invoice: {
          is: {
            referenceMonth: {
              gte: new Date('2026-11-01T00:00:00.000Z'),
              lt: new Date('2026-12-01T00:00:00.000Z'),
            },
          },
        },
        purchase: {
          is: {
            tenantId: input.tenantId,
            userId: input.userId,
          },
        },
      },
      _sum: { amount: true },
    });
  });

  it('respeita o vínculo ativo do usuário com as contas', async () => {
    await useCase.execute(input);

    expect(prisma.transaction.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          account: {
            accountMembers: {
              some: {
                userId: input.userId,
                status: 'ACTIVE',
              },
            },
          },
        }),
      }),
    );

    expect(
      prisma.financialObligationSettlement.groupBy,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          account: {
            accountMembers: {
              some: {
                userId: input.userId,
                status: 'ACTIVE',
              },
            },
          },
        }),
      }),
    );
  });

  it('preserva despesas sem forma de pagamento informada', async () => {
    prisma.transaction.groupBy.mockResolvedValue([
      {
        paymentMethod: null,
        _sum: { amount: new Prisma.Decimal('75.50') },
      },
    ]);

    const result = await useCase.execute(input);

    expect(result.totalAmount).toBe(75.5);
    expect(result.methods).toEqual([
      {
        paymentMethod: null,
        totalAmount: 75.5,
        percentage: 100,
      },
    ]);
  });

  it('retorna total zero quando não existem despesas no mês', async () => {
    const result = await useCase.execute(input);

    expect(result).toEqual({
      month: '2026-11',
      totalAmount: 0,
      methods: [],
    });
  });

  it('usa o mês atual de São Paulo quando o mês não é informado', async () => {
    const result = await useCase.execute({
      tenantId: input.tenantId,
      userId: input.userId,
    });

    expect(result.month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    expect(prisma.transaction.groupBy).toHaveBeenCalled();
  });
});
