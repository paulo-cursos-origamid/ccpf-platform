import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';

@Injectable()
export class GetCreditCardDashboardUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: { tenantId: string }) {
    const now = new Date();
    const currentMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    const firstMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
    );

    const [cards, invoices, obligations] = await Promise.all([
      this.prisma.creditCard.findMany({
        where: {
          tenantId: input.tenantId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          brand: true,
          lastFourDigits: true,
          creditLimit: true,
        },
        orderBy: { createdAt: 'asc' },
      }),

      this.prisma.creditCardInvoice.findMany({
        where: {
          tenantId: input.tenantId,
        },
        include: {
          creditCard: {
            select: {
              id: true,
              name: true,
              brand: true,
              lastFourDigits: true,
            },
          },
          installments: {
            select: {
              amount: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),

      this.prisma.financialObligation.findMany({
        where: {
          tenantId: input.tenantId,
          sourceType: 'CREDIT_CARD_INVOICE',
          type: 'PAYABLE',
          status: {
            in: ['PENDING', 'PARTIALLY_SETTLED'],
          },
        },
        select: {
          sourceId: true,
          amount: true,
          settlements: {
            select: {
              principalAmount: true,
            },
          },
        },
      }),
    ]);

    const invoiceById = new Map(
      invoices.map((invoice) => [invoice.id, invoice]),
    );

    const remainingByInvoice = new Map<string, number>();

    for (const obligation of obligations) {
      if (!obligation.sourceId) continue;

      const paidPrincipal = obligation.settlements.reduce(
        (total, settlement) =>
          total + Number(settlement.principalAmount),
        0,
      );

      const remaining = Math.max(
        Number(obligation.amount) - paidPrincipal,
        0,
      );

      if (remaining > 0 && invoiceById.has(obligation.sourceId)) {
        remainingByInvoice.set(obligation.sourceId, remaining);
      }
    }

    const activeCardIds = new Set(cards.map((card) => card.id));

    const committedByCard = new Map<string, number>();

    for (const [invoiceId, remaining] of remainingByInvoice) {
      const invoice = invoiceById.get(invoiceId);

      if (!invoice || !activeCardIds.has(invoice.creditCardId)) {
        continue;
      }

      const current =
        committedByCard.get(invoice.creditCardId) ?? 0;

      committedByCard.set(
        invoice.creditCardId,
        current + remaining,
      );
    }

    const totalLimit = cards.reduce(
      (total, card) => total + Number(card.creditLimit),
      0,
    );

    const committedLimit = [...committedByCard.values()].reduce(
      (total, amount) => total + amount,
      0,
    );

    const openInvoices = [...remainingByInvoice.entries()]
      .map(([invoiceId, remainingAmount]) => {
        const invoice = invoiceById.get(invoiceId);

        if (!invoice) return null;

        return {
          id: invoice.id,
          creditCard: invoice.creditCard,
          referenceMonth: invoice.referenceMonth,
          dueDate: invoice.dueDate,
          remainingAmount,
        };
      })
      .filter((invoice) => invoice !== null)
      .sort(
        (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
      );

    const monthlyTotals = new Map<string, number>();

    for (let index = 0; index < 12; index++) {
      const month = new Date(
        Date.UTC(
          firstMonth.getUTCFullYear(),
          firstMonth.getUTCMonth() + index,
          1,
        ),
      );

      monthlyTotals.set(month.toISOString().slice(0, 7), 0);
    }

    for (const invoice of invoices) {
      const monthKey = invoice.referenceMonth
        .toISOString()
        .slice(0, 7);

      if (!monthlyTotals.has(monthKey)) continue;

      const installmentTotal = invoice.installments.reduce(
        (total, installment) => total + Number(installment.amount),
        0,
      );

      monthlyTotals.set(
        monthKey,
        (monthlyTotals.get(monthKey) ?? 0) + installmentTotal,
      );
    }

    const monthlyExpenses = [...monthlyTotals.entries()].map(
      ([referenceMonth, totalAmount]) => ({
        referenceMonth,
        totalAmount: totalAmount.toFixed(2),
      }),
    );

    const cardSummaries = cards.map((card) => {
      const cardInvoices = openInvoices.filter(
        (invoice) => invoice.creditCard.id === card.id,
      );

      const committed = committedByCard.get(card.id) ?? 0;
      const nextInvoice = cardInvoices[0] ?? null;

      return {
        id: card.id,
        name: card.name,
        brand: card.brand,
        lastFourDigits: card.lastFourDigits,
        creditLimit: Number(card.creditLimit).toFixed(2),
        committedAmount: committed.toFixed(2),
        availableLimit: Math.max(
          Number(card.creditLimit) - committed,
          0,
        ).toFixed(2),
        nextInvoice: nextInvoice
          ? {
              id: nextInvoice.id,
              referenceMonth: nextInvoice.referenceMonth,
              dueDate: nextInvoice.dueDate,
              remainingAmount:
                nextInvoice.remainingAmount.toFixed(2),
            }
          : null,
      };
    });

    return {
      summary: {
        totalLimit: totalLimit.toFixed(2),
        committedLimit: committedLimit.toFixed(2),
        availableLimit: Math.max(
          totalLimit - committedLimit,
          0,
        ).toFixed(2),
        openInvoiceCount: openInvoices.length,
        openInvoiceAmount: openInvoices
          .reduce(
            (total, invoice) => total + invoice.remainingAmount,
            0,
          )
          .toFixed(2),
      },
      monthlyExpenses,
      cards: cardSummaries,
      upcomingInvoices: openInvoices.slice(0, 5).map((invoice) => ({
        id: invoice.id,
        creditCard: invoice.creditCard,
        referenceMonth: invoice.referenceMonth,
        dueDate: invoice.dueDate,
        remainingAmount: invoice.remainingAmount.toFixed(2),
      })),
    };
  }
}
