import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { GetCreditCardDashboardUseCase } from './get-credit-card-dashboard.use-case';

describe('GetCreditCardDashboardUseCase', () => {
  let prisma: any;
  let useCase: GetCreditCardDashboardUseCase;

  beforeEach(() => {
    prisma = {
      creditCard: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      creditCardInvoice: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      financialObligation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    useCase = new GetCreditCardDashboardUseCase(
      prisma as PrismaService,
    );
  });

  it('deve consultar os dados somente do tenant informado', async () => {
    const result = await useCase.execute({
      tenantId: 'tenant-1',
    });

    expect(prisma.creditCard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          status: 'ACTIVE',
        },
      }),
    );

    expect(prisma.creditCardInvoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1' },
      }),
    );

    expect(prisma.financialObligation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          sourceType: 'CREDIT_CARD_INVOICE',
          type: 'PAYABLE',
        }),
      }),
    );

    expect(result.summary).toEqual({
      totalLimit: '0.00',
      committedLimit: '0.00',
      availableLimit: '0.00',
      openInvoiceCount: 0,
      openInvoiceAmount: '0.00',
    });

    expect(result.monthlyExpenses).toHaveLength(12);
    expect(result.cards).toEqual([]);
    expect(result.upcomingInvoices).toEqual([]);
  });

  it('deve calcular limites considerando somente o principal pendente', async () => {
    prisma.creditCard.findMany.mockResolvedValue([
      {
        id: 'card-1',
        name: 'Cartão principal',
        brand: 'VISA',
        lastFourDigits: '1234',
        creditLimit: 5000,
      },
    ]);

    prisma.creditCardInvoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        creditCardId: 'card-1',
        referenceMonth: new Date('2026-11-01T00:00:00.000Z'),
        dueDate: new Date('2026-11-20T00:00:00.000Z'),
        creditCard: {
          id: 'card-1',
          name: 'Cartão principal',
          brand: 'VISA',
          lastFourDigits: '1234',
        },
        installments: [
          { amount: 300 },
          { amount: 200 },
        ],
      },
    ]);

    prisma.financialObligation.findMany.mockResolvedValue([
      {
        sourceId: 'invoice-1',
        amount: 500,
        settlements: [
          { principalAmount: 100 },
        ],
      },
    ]);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
    });

    expect(result.summary).toEqual({
      totalLimit: '5000.00',
      committedLimit: '400.00',
      availableLimit: '4600.00',
      openInvoiceCount: 1,
      openInvoiceAmount: '400.00',
    });

    expect(result.cards[0]).toEqual(
      expect.objectContaining({
        id: 'card-1',
        creditLimit: '5000.00',
        committedAmount: '400.00',
        availableLimit: '4600.00',
      }),
    );

    expect(result.upcomingInvoices).toHaveLength(1);
    expect(result.upcomingInvoices[0].remainingAmount).toBe('400.00');
  });

  it('não deve considerar faturas sem saldo principal pendente', async () => {
    prisma.creditCardInvoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        creditCardId: 'card-1',
        referenceMonth: new Date('2026-11-01T00:00:00.000Z'),
        dueDate: new Date('2026-11-20T00:00:00.000Z'),
        creditCard: {
          id: 'card-1',
          name: 'Cartão principal',
          brand: 'VISA',
          lastFourDigits: '1234',
        },
        installments: [],
      },
    ]);

    prisma.financialObligation.findMany.mockResolvedValue([
      {
        sourceId: 'invoice-1',
        amount: 500,
        settlements: [
          { principalAmount: 500 },
        ],
      },
    ]);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
    });

    expect(result.summary.openInvoiceCount).toBe(0);
    expect(result.summary.openInvoiceAmount).toBe('0.00');
    expect(result.upcomingInvoices).toEqual([]);
  });
});
