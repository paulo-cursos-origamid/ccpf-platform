import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { ListCreditCardInvoicesUseCase } from './list-credit-card-invoices.use-case';

describe('ListCreditCardInvoicesUseCase', () => {
  let prisma: any;
  let useCase: ListCreditCardInvoicesUseCase;

  beforeEach(() => {
    prisma = {
      creditCardInvoice: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      financialObligation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    useCase = new ListCreditCardInvoicesUseCase(prisma as PrismaService);
  });

  it('deve listar faturas somente do tenant informado com paginação padrão', async () => {
    const result = await useCase.execute({ tenantId: 'tenant-1' });

    expect(result).toEqual({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });

    expect(prisma.creditCardInvoice.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      skip: 0,
      take: 10,
      include: expect.any(Object),
      orderBy: [{ referenceMonth: 'desc' }, { dueDate: 'asc' }],
    });

    expect(prisma.creditCardInvoice.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
    });

    expect(prisma.financialObligation.findMany).not.toHaveBeenCalled();
  });

  it('deve aplicar filtros de cartão, status e período', async () => {
    await useCase.execute({
      tenantId: 'tenant-1',
      creditCardId: 'card-1',
      status: 'CLOSED',
      referenceMonthFrom: '2026-01-01T00:00:00.000Z',
      referenceMonthTo: '2026-12-31T23:59:59.999Z',
    });

    const expectedWhere = {
      tenantId: 'tenant-1',
      creditCardId: 'card-1',
      status: 'CLOSED',
      referenceMonth: {
        gte: new Date('2026-01-01T00:00:00.000Z'),
        lte: new Date('2026-12-31T23:59:59.999Z'),
      },
    };

    expect(prisma.creditCardInvoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedWhere,
        skip: 0,
        take: 10,
      }),
    );

    expect(prisma.creditCardInvoice.count).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });

  it('deve calcular skip e take conforme a página solicitada', async () => {
    prisma.creditCardInvoice.count.mockResolvedValue(36);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      page: 3,
      limit: 10,
    });

    expect(prisma.creditCardInvoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      }),
    );

    expect(result.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 36,
      totalPages: 4,
    });
  });

  it('deve limitar o máximo de registros por página a 100', async () => {
    const result = await useCase.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 150,
    });

    expect(prisma.creditCardInvoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 100,
      }),
    );

    expect(result.pagination.limit).toBe(100);
  });

  it('deve rejeitar um período invertido', async () => {
    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        referenceMonthFrom: '2026-12-01T00:00:00.000Z',
        referenceMonthTo: '2026-01-01T00:00:00.000Z',
      }),
    ).rejects.toThrow('A data inicial não pode ser posterior à data final.');

    expect(prisma.creditCardInvoice.findMany).not.toHaveBeenCalled();
    expect(prisma.creditCardInvoice.count).not.toHaveBeenCalled();
  });

  it('deve calcular indicadores e agrupar parcelas por compra', async () => {
    const purchase = {
      id: 'purchase-1',
      title: 'Notebook',
      totalAmount: new Prisma.Decimal('300.00'),
      purchaseDate: new Date('2026-10-10T12:00:00.000Z'),
      installmentCount: 3,
    };

    prisma.creditCardInvoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        creditCard: {
          id: 'card-1',
          name: 'Cartão principal',
          brand: 'VISA',
          lastFourDigits: '1234',
        },
        referenceMonth: new Date('2026-11-01T00:00:00.000Z'),
        closingDate: new Date('2026-11-10T00:00:00.000Z'),
        dueDate: new Date('2026-11-17T00:00:00.000Z'),
        status: 'CLOSED',
        createdAt: new Date('2026-10-01T00:00:00.000Z'),
        updatedAt: new Date('2026-10-01T00:00:00.000Z'),
        installments: [
          {
            id: 'installment-1',
            purchaseId: 'purchase-1',
            installmentNumber: 2,
            amount: new Prisma.Decimal('100.00'),
            dueDate: new Date('2026-11-17T00:00:00.000Z'),
            purchase,
          },
        ],
      },
    ]);

    prisma.financialObligation.findMany.mockResolvedValue([
      {
        sourceId: 'invoice-1',
        status: 'PARTIALLY_SETTLED',
        settlements: [
          {
            principalAmount: new Prisma.Decimal('40.00'),
            interestAmount: new Prisma.Decimal('2.00'),
            feeAmount: new Prisma.Decimal('0.00'),
            discountAmount: new Prisma.Decimal('5.00'),
            settledAt: new Date('2026-11-05T00:00:00.000Z'),
          },
        ],
      },
    ]);

    const result = await useCase.execute({ tenantId: 'tenant-1' });
    const [invoice] = result.data;

    expect(invoice.indicators).toEqual({
      totalAmount: '100.00',
      installmentCount: 1,
      purchaseCount: 1,
      principalPaidAmount: '40.00',
      paidAmount: '37.00',
      remainingAmount: '60.00',
      interestAmount: '2.00',
      feeAmount: '0.00',
      discountAmount: '5.00',
      financialObligationStatus: 'PARTIALLY_SETTLED',
    });

    expect(invoice.settlements).toEqual([
      {
        principalAmount: '40.00',
        interestAmount: '2.00',
        feeAmount: '0.00',
        discountAmount: '5.00',
        settledAt: new Date('2026-11-05T00:00:00.000Z'),
      },
    ]);

    expect(invoice.purchases[0]).toEqual(
      expect.objectContaining({
        id: 'purchase-1',
        title: 'Notebook',
        invoiceAmount: '100.00',
        installments: [
          expect.objectContaining({
            installmentNumber: 2,
            amount: '100.00',
          }),
        ],
      }),
    );

    expect(prisma.financialObligation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          sourceType: 'CREDIT_CARD_INVOICE',
          sourceId: { in: ['invoice-1'] },
        },
      }),
    );
  });
});
