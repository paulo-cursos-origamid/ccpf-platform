import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { GetCreditCardInvoiceUseCase } from './get-credit-card-invoice.use-case';

describe('GetCreditCardInvoiceUseCase', () => {
  let prisma: any;
  let useCase: GetCreditCardInvoiceUseCase;

  beforeEach(() => {
    prisma = {
      creditCardInvoice: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      financialObligation: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    useCase = new GetCreditCardInvoiceUseCase(prisma as PrismaService);
  });

  it('deve rejeitar uma fatura inexistente no tenant', async () => {
    await expect(
      useCase.execute({
        invoiceId: 'invoice-1',
        tenantId: 'tenant-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.creditCardInvoice.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'invoice-1', tenantId: 'tenant-1' },
      }),
    );
    expect(prisma.financialObligation.findFirst).not.toHaveBeenCalled();
  });

  it('deve retornar detalhes, parcelas e indicadores da fatura', async () => {
    prisma.creditCardInvoice.findFirst.mockResolvedValue({
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
      status: 'OPEN',
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      updatedAt: new Date('2026-10-01T00:00:00.000Z'),
      installments: [
        {
          id: 'installment-1',
          purchaseId: 'purchase-1',
          installmentNumber: 1,
          amount: new Prisma.Decimal('125.50'),
          dueDate: new Date('2026-11-17T00:00:00.000Z'),
          purchase: {
            id: 'purchase-1',
            title: 'Monitor',
            totalAmount: new Prisma.Decimal('251.00'),
            purchaseDate: new Date('2026-10-10T12:00:00.000Z'),
            installmentCount: 2,
          },
        },
      ],
    });

    prisma.financialObligation.findFirst.mockResolvedValue(null);

    const result = await useCase.execute({
      invoiceId: 'invoice-1',
      tenantId: 'tenant-1',
    });

    expect(result.id).toBe('invoice-1');
    expect(result.indicators).toEqual({
      totalAmount: '125.50',
      installmentCount: 1,
      purchaseCount: 1,
      principalPaidAmount: '0.00',
      paidAmount: '0.00',
      remainingAmount: '125.50',
      interestAmount: '0.00',
      feeAmount: '0.00',
      discountAmount: '0.00',
      financialObligationStatus: null,
    });
    expect(result.purchases[0].installments).toHaveLength(1);

    expect(prisma.financialObligation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          sourceType: 'CREDIT_CARD_INVOICE',
          sourceId: 'invoice-1',
        },
      }),
    );
  });
});
