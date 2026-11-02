import { Injectable } from '@nestjs/common';
import { InstallmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

const MONTHS_AHEAD = 12;

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

function money(value: Prisma.Decimal | number | null | undefined): number {
  return value == null ? 0 : Number(value);
}

function dueDateForMonth(year: number, month: number, day: number): Date {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

@Injectable()
export class GetFinancialProjectionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string, userId: string) {
    const now = new Date();
    const currentMonth = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
    ));
    const endMonth = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + MONTHS_AHEAD,
      1,
    ));

    const accountAccess: Prisma.AccountWhereInput = {
      tenantId,
      archivedAt: null,
      currency: 'BRL',
      status: 'ACTIVE',
      accountMembers: {
        some: { userId, status: 'ACTIVE' as const },
      },
    };

    const [accounts, plans, bills] = await Promise.all([
      this.prisma.account.findMany({
        where: {
          ...accountAccess,
        },
        select: { balance: true },
      }),

      this.prisma.installmentPlan.findMany({
        where: {
          tenantId,
          deletedAt: null,
          account: accountAccess,
        },
        include: {
          installments: {
            where: {
              status: {
                in: [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE],
              },
              dueDate: { lt: endMonth },
            },
            select: {
              amount: true,
              dueDate: true,
              status: true,
              transactionId: true,
            },
          },
        },
      }),

      this.prisma.recurringBill.findMany({
        where: {
          tenantId,
          isActive: true,
          account: accountAccess,
          startDate: { lt: endMonth },
          OR: [{ endDate: null }, { endDate: { gte: currentMonth } }],
        },
        include: {
          occurrences: {
            where: {
              referenceMonth: {
                gte: currentMonth,
                lt: endMonth,
              },
            },
            select: {
              referenceMonth: true,
              dueDate: true,
              expectedAmount: true,
              status: true,
              transactionId: true,
            },
          },
        },
      }),
    ]);

    const initialBalance = accounts.reduce(
      (total, account) => total + money(account.balance),
      0,
    );

    const months = Array.from({ length: MONTHS_AHEAD }, (_, index) => {
      const date = new Date(Date.UTC(
        currentMonth.getUTCFullYear(),
        currentMonth.getUTCMonth() + index,
        1,
      ));

      return {
        date,
        month: monthKey(date),
        label: monthLabel(date),
        installments: 0,
        recurringExpenses: 0,
        expenses: 0,
        projectedBalance: 0,
      };
    });

    const monthMap = new Map(months.map((month) => [month.month, month]));

    for (const plan of plans) {
      for (const installment of plan.installments) {
        if (installment.transactionId) continue;

        const key = monthKey(installment.dueDate);
        const month = monthMap.get(key);

        if (month) {
          month.installments += money(installment.amount);
        }
      }
    }

    for (const bill of bills) {
      const occurrences = new Map(
        bill.occurrences.map((occurrence) => [
          monthKey(occurrence.referenceMonth),
          occurrence,
        ]),
      );

      const start = new Date(bill.startDate);
      const startMonth = new Date(Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        1,
      ));
      const end = bill.endDate ? new Date(bill.endDate) : null;

      for (const month of months) {
        const monthDate = month.date;
        const difference =
          (monthDate.getUTCFullYear() - startMonth.getUTCFullYear()) * 12 +
          monthDate.getUTCMonth() - startMonth.getUTCMonth();

        if (difference < 0) continue;
        if (end && monthDate > new Date(Date.UTC(
          end.getUTCFullYear(),
          end.getUTCMonth(),
          1,
        ))) continue;

        const interval =
          bill.frequency === 'MONTHLY' ? 1 :
          bill.frequency === 'QUARTERLY' ? 3 : 12;

        if (difference % interval !== 0) continue;

        const occurrence = occurrences.get(month.month);

        // Ocorrências pagas ou canceladas não voltam à projeção.
        if (occurrence) {
          if (
            occurrence.status !== 'PENDING' ||
            occurrence.transactionId
          ) continue;
        }

        const amount = occurrence?.expectedAmount ?? bill.expectedAmount;
        if (amount == null) continue;

        const dueDate = occurrence?.dueDate ?? dueDateForMonth(
          monthDate.getUTCFullYear(),
          monthDate.getUTCMonth(),
          bill.dueDay,
        );

        const dueDateKey = Date.UTC(
          dueDate.getUTCFullYear(),
          dueDate.getUTCMonth(),
          dueDate.getUTCDate(),
        );
        const startDateKey = Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth(),
          start.getUTCDate(),
        );
        const endDateKey = end
          ? Date.UTC(
              end.getUTCFullYear(),
              end.getUTCMonth(),
              end.getUTCDate(),
            )
          : null;

        if (dueDateKey < startDateKey) continue;
        if (endDateKey !== null && dueDateKey > endDateKey) continue;

        month.recurringExpenses += money(amount);
      }
    }

    let balance = initialBalance;

    for (const month of months) {
      month.expenses = month.installments + month.recurringExpenses;
      balance -= month.expenses;
      month.projectedBalance = Number(balance.toFixed(2));
      month.installments = Number(month.installments.toFixed(2));
      month.recurringExpenses = Number(month.recurringExpenses.toFixed(2));
      month.expenses = Number(month.expenses.toFixed(2));
    }

    return {
      initialBalance: Number(initialBalance.toFixed(2)),
      months: months.map(({ date, ...month }) => month),
    };
  }
}
