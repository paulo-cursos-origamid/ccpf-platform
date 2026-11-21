import { Injectable } from '@nestjs/common';
import {
  FinancialPaymentMethod,
  Prisma,
  TransactionType,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface GetPaymentMethodsSummaryInput {
  tenantId: string;
  userId: string;
  month?: string;
}

@Injectable()
export class GetPaymentMethodsSummaryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: GetPaymentMethodsSummaryInput) {
    const month = input.month ?? this.getCurrentMonth();
    const [year, monthNumber] = month.split('-').map(Number);

    const startDate = new Date(Date.UTC(year, monthNumber - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNumber, 1));

    const [transactions, settlements, cardInstallments] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['paymentMethod'],
        where: {
          tenantId: input.tenantId,
          userId: input.userId,
          type: TransactionType.EXPENSE,
          deletedAt: null,
          date: { gte: startDate, lt: endDate },
          financialObligationSettlement: { is: null },
          account: {
            accountMembers: {
              some: { userId: input.userId, status: 'ACTIVE' },
            },
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.financialObligationSettlement.groupBy({
        by: ['paymentMethod'],
        where: {
          tenantId: input.tenantId,
          userId: input.userId,
          settledAt: { gte: startDate, lt: endDate },
          account: {
            accountMembers: {
              some: { userId: input.userId, status: 'ACTIVE' },
            },
          },
          obligation: {
            is: {
              type: 'PAYABLE',
              sourceType: { not: 'CREDIT_CARD_INVOICE' },
            },
          },
        },
        _sum: { settledAmount: true },
      }),
      this.prisma.creditCardInstallment.aggregate({
        where: {
          tenantId: input.tenantId,
          invoice: {
            is: {
              referenceMonth: { gte: startDate, lt: endDate },
            },
          },
          purchase: {
            is: { tenantId: input.tenantId, userId: input.userId },
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const totals = new Map<FinancialPaymentMethod | null, Prisma.Decimal>();

    const addTotal = (
      paymentMethod: FinancialPaymentMethod | null,
      amount: Prisma.Decimal | number | null,
    ) => {
      if (amount === null || new Prisma.Decimal(amount).lte(0)) {
        return;
      }

      const current = totals.get(paymentMethod) ?? new Prisma.Decimal(0);
      totals.set(paymentMethod, current.plus(amount));
    };

    transactions.forEach((item) =>
      addTotal(item.paymentMethod, item._sum.amount),
    );

    settlements.forEach((item) =>
      addTotal(item.paymentMethod, item._sum.settledAmount),
    );

    addTotal(
      FinancialPaymentMethod.CREDIT_CARD,
      cardInstallments._sum.amount,
    );

    const totalAmount = Array.from(totals.values()).reduce(
      (total, amount) => total.plus(amount),
      new Prisma.Decimal(0),
    );

    const methods = Array.from(totals.entries())
      .map(([paymentMethod, amount]) => ({ paymentMethod, amount }))
      .sort((a, b) => b.amount.comparedTo(a.amount));

    return {
      month,
      totalAmount: totalAmount.toNumber(),
      methods: methods.map(({ paymentMethod, amount }) => ({
        paymentMethod,
        totalAmount: amount.toNumber(),
        percentage: totalAmount.isZero()
          ? 0
          : amount.div(totalAmount).mul(100).toDecimalPlaces(2).toNumber(),
      })),
    };
  }

  private getCurrentMonth(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;

    return `${year}-${month}`;
  }
}
