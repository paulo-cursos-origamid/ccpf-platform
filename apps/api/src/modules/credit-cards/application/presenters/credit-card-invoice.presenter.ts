import { Prisma } from '@prisma/client';

export const creditCardInvoiceDetailsInclude = {
  creditCard: {
    select: {
      id: true,
      name: true,
      brand: true,
      lastFourDigits: true,
    },
  },
  installments: {
    orderBy: [{ purchaseId: 'asc' }, { installmentNumber: 'asc' }],
    include: {
      purchase: {
        select: {
          id: true,
          title: true,
          totalAmount: true,
          purchaseDate: true,
          installmentCount: true,
        },
      },
    },
  },
} satisfies Prisma.CreditCardInvoiceInclude;

export type CreditCardInvoiceWithDetails =
  Prisma.CreditCardInvoiceGetPayload<{
    include: typeof creditCardInvoiceDetailsInclude;
  }>;

export const creditCardInvoiceObligationSelect = {
  sourceId: true,
  status: true,
  settlements: {
    select: {
      principalAmount: true,
      interestAmount: true,
      feeAmount: true,
      discountAmount: true,
      settledAt: true,
    },
    orderBy: { settledAt: 'asc' },
  },
} satisfies Prisma.FinancialObligationSelect;

export type CreditCardInvoiceObligation =
  Prisma.FinancialObligationGetPayload<{
    select: typeof creditCardInvoiceObligationSelect;
  }>;

interface PurchaseSummary {
  id: string;
  title: string;
  totalAmount: string;
  purchaseDate: Date;
  installmentCount: number;
  invoiceAmount: Prisma.Decimal;
  installments: Array<{
    id: string;
    installmentNumber: number;
    amount: string;
    dueDate: Date;
  }>;
}

export function presentCreditCardInvoice(
  invoice: CreditCardInvoiceWithDetails,
  obligation?: CreditCardInvoiceObligation | null,
) {
  const zero = new Prisma.Decimal(0);

  const totalAmount = invoice.installments.reduce(
    (total, installment) => total.add(installment.amount),
    zero,
  );

  const settlements = obligation?.settlements ?? [];

  const principalPaidAmount = settlements.reduce(
    (total, settlement) => total.add(settlement.principalAmount),
    zero,
  );

  const interestAmount = settlements.reduce(
    (total, settlement) => total.add(settlement.interestAmount),
    zero,
  );

  const feeAmount = settlements.reduce(
    (total, settlement) => total.add(settlement.feeAmount),
    zero,
  );

  const discountAmount = settlements.reduce(
    (total, settlement) => total.add(settlement.discountAmount),
    zero,
  );

  const paidAmount = settlements.reduce(
    (total, settlement) =>
      total
        .add(settlement.principalAmount)
        .add(settlement.interestAmount)
        .add(settlement.feeAmount)
        .minus(settlement.discountAmount),
    zero,
  );

  const remainingAmount = totalAmount.minus(principalPaidAmount);
  const safeRemainingAmount = remainingAmount.gt(0)
    ? remainingAmount
    : zero;

  const purchases = new Map<string, PurchaseSummary>();

  for (const installment of invoice.installments) {
    const purchase = installment.purchase;
    let summary = purchases.get(purchase.id);

    if (!summary) {
      summary = {
        id: purchase.id,
        title: purchase.title,
        totalAmount: purchase.totalAmount.toFixed(2),
        purchaseDate: purchase.purchaseDate,
        installmentCount: purchase.installmentCount,
        invoiceAmount: zero,
        installments: [],
      };
      purchases.set(purchase.id, summary);
    }

    summary.invoiceAmount = summary.invoiceAmount.add(installment.amount);
    summary.installments.push({
      id: installment.id,
      installmentNumber: installment.installmentNumber,
      amount: installment.amount.toFixed(2),
      dueDate: installment.dueDate,
    });
  }

  return {
    id: invoice.id,
    creditCard: invoice.creditCard,
    referenceMonth: invoice.referenceMonth,
    closingDate: invoice.closingDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    indicators: {
      totalAmount: totalAmount.toFixed(2),
      installmentCount: invoice.installments.length,
      purchaseCount: purchases.size,
      principalPaidAmount: principalPaidAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      remainingAmount: safeRemainingAmount.toFixed(2),
      interestAmount: interestAmount.toFixed(2),
      feeAmount: feeAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      financialObligationStatus: obligation?.status ?? null,
    },
    purchases: Array.from(purchases.values()).map((purchase) => ({
      id: purchase.id,
      title: purchase.title,
      totalAmount: purchase.totalAmount,
      purchaseDate: purchase.purchaseDate,
      installmentCount: purchase.installmentCount,
      invoiceAmount: purchase.invoiceAmount.toFixed(2),
      installments: purchase.installments,
    })),
  };
}
