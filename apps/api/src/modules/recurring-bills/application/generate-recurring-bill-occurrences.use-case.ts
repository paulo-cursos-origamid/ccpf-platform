import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RecurringBillFrequency,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class GenerateRecurringBillOccurrencesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    tenantId: string,
    userId: string,
    recurringBillId: string,
  ) {
    const bill = await this.prisma.recurringBill.findFirst({
      where: {
        id: recurringBillId,
        tenantId,
      },
    });

    if (!bill) {
      throw new NotFoundException(
        'Conta recorrente não encontrada neste Espaço.',
      );
    }

    const membership = await this.prisma.accountMember.findFirst({
      where: {
        accountId: bill.accountId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!membership || membership.role === 'VIEWER') {
      throw new ForbiddenException(
        'Você não tem permissão para gerar vencimentos nesta conta.',
      );
    }

    if (!bill.isActive) {
      return this.listOccurrences(tenantId, bill.id);
    }

    const interval = this.getInterval(bill.frequency);

    const startMonth = new Date(
      Date.UTC(
        bill.startDate.getUTCFullYear(),
        bill.startDate.getUTCMonth(),
        1,
      ),
    );

    const now = new Date();

    const horizon = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 12,
        1,
      ),
    );

    const endDate = bill.endDate;

    const occurrences: Prisma.RecurringBillOccurrenceCreateManyInput[] = [];

    for (let index = 0; index < 240; index++) {
      const referenceMonth = new Date(
        Date.UTC(
          startMonth.getUTCFullYear(),
          startMonth.getUTCMonth() + index * interval,
          1,
        ),
      );

      if (referenceMonth > horizon) {
        break;
      }

      const year = referenceMonth.getUTCFullYear();
      const month = referenceMonth.getUTCMonth();

      const lastDay = new Date(
        Date.UTC(year, month + 1, 0),
      ).getUTCDate();

      const day = Math.min(bill.dueDay, lastDay);

      const dueDate = new Date(
        Date.UTC(year, month, day, 12),
      );

      if (dueDate < bill.startDate) {
        continue;
      }

      if (endDate && dueDate > endDate) {
        break;
      }

      occurrences.push({
        tenantId,
        recurringBillId: bill.id,
        referenceMonth,
        dueDate,
        expectedAmount: bill.expectedAmount,
        status: 'PENDING',
      });
    }

    if (occurrences.length > 0) {
      await this.prisma.recurringBillOccurrence.createMany({
        data: occurrences,
        skipDuplicates: true,
      });
    }

    return this.listOccurrences(tenantId, bill.id);
  }

  private getInterval(frequency: RecurringBillFrequency): number {
    switch (frequency) {
      case RecurringBillFrequency.MONTHLY:
        return 1;
      case RecurringBillFrequency.QUARTERLY:
        return 3;
      case RecurringBillFrequency.YEARLY:
        return 12;
    }
  }

  private async listOccurrences(
    tenantId: string,
    recurringBillId: string,
  ) {
    const occurrences =
      await this.prisma.recurringBillOccurrence.findMany({
        where: {
          tenantId,
          recurringBillId,
        },
        orderBy: {
          dueDate: 'asc',
        },
      });

    return occurrences.map((item) => ({
      ...item,
      expectedAmount: item.expectedAmount?.toString() ?? null,
      paidAmount: item.paidAmount?.toString() ?? null,
    }));
  }
}
