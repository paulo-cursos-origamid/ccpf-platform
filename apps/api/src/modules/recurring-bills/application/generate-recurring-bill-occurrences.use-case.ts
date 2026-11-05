import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RecurringBill,
  RecurringBillFrequency,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { FinancialObligationEntity } from '../../accounts-payable-receivable/domain/entities/financial-obligation.entity';
import { FinancialObligationSourceType } from '../../accounts-payable-receivable/domain/enums/financial-obligation-source-type.enum';
import { FinancialObligationType } from '../../accounts-payable-receivable/domain/enums/financial-obligation-type.enum';
import { FinancialObligationRepository } from '../../accounts-payable-receivable/domain/repositories/financial-obligation.repository';

@Injectable()
export class GenerateRecurringBillOccurrencesUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly obligations: FinancialObligationRepository,
  ) {}

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
      const existing = await this.listOccurrences(tenantId, bill.id);
      await this.ensureFinancialObligations(bill, existing);
      return existing;
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
    const startDateKey = Date.UTC(
      bill.startDate.getUTCFullYear(),
      bill.startDate.getUTCMonth(),
      bill.startDate.getUTCDate(),
    );

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

      const dueDateKey = Date.UTC(year, month, day);

      if (dueDateKey < startDateKey) {
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

    const listed = await this.listOccurrences(tenantId, bill.id);
    await this.ensureFinancialObligations(bill, listed);
    return listed;
  }

  private async ensureFinancialObligations(
    bill: RecurringBill,
    occurrences: Array<{
      id: string;
      dueDate: Date;
      expectedAmount: string | null;
    }>,
  ): Promise<void> {
    for (const occurrence of occurrences) {
      const amount = occurrence.expectedAmount?.trim();
      if (!amount || !/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/.test(amount)) {
        continue;
      }

      const obligation = new FinancialObligationEntity({
        tenantId: bill.tenantId,
        userId: bill.userId,
        accountId: bill.accountId,
        categoryId: bill.categoryId,
        subCategoryId: bill.subCategoryId,
        type: FinancialObligationType.PAYABLE,
        title: bill.title,
        amount,
        dueDate: occurrence.dueDate,
        description: bill.description,
        sourceType: FinancialObligationSourceType.RECURRING_BILL_OCCURRENCE,
        sourceId: occurrence.id,
      });

      await this.obligations.createOrFindBySource(obligation);
    }
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
