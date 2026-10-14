import { randomUUID } from 'node:crypto';

import { BadRequestException } from '@nestjs/common';

import { InvoiceEntity } from '../entities/invoice.entity';
import { InvoiceInstallmentEntity } from '../entities/invoice-installment.entity';
import { InvoiceInstallmentStatus } from '../enums/invoice-installment-status.enum';

export class InvoiceInstallmentScheduleService {
  static readonly ALLOWED_INSTALLMENT_COUNTS = [1, 2, 3, 6, 12] as const;

  static isAllowedInstallmentCount(installmentCount: number): boolean {
    return this.ALLOWED_INSTALLMENT_COUNTS.includes(
      installmentCount as (typeof this.ALLOWED_INSTALLMENT_COUNTS)[number],
    );
  }

  static validateInstallmentCount(installmentCount: number): void {
    if (
      !Number.isInteger(installmentCount) ||
      !this.isAllowedInstallmentCount(installmentCount)
    ) {
      throw new BadRequestException(
        'A quantidade de parcelas deve ser 1, 2, 3, 6 ou 12.',
      );
    }
  }

  static create(invoice: InvoiceEntity): InvoiceInstallmentEntity[] {
    const totalCount = invoice.installmentCount;

    this.validateInstallmentCount(totalCount);

    const totalCents = Math.round(invoice.amount * 100);
    const baseCents = Math.floor(totalCents / totalCount);
    const remainderCents = totalCents % totalCount;

    return Array.from({ length: totalCount }, (_, index) => {
      const number = index + 1;

      const amountCents =
        number === totalCount ? baseCents + remainderCents : baseCents;

      return new InvoiceInstallmentEntity(
        randomUUID(),
        invoice.id,
        number,
        totalCount,
        amountCents / 100,
        invoice.currency,
        this.calculateDueDate(invoice.dueAt, index),
        InvoiceInstallmentStatus.PENDING,
        null,
        invoice.createdAt,
        invoice.updatedAt,
      );
    });
  }

  private static calculateDueDate(firstDueAt: Date, monthOffset: number): Date {
    const source = new Date(firstDueAt);

    const targetYear =
      source.getUTCFullYear() +
      Math.floor((source.getUTCMonth() + monthOffset) / 12);

    const targetMonth = (source.getUTCMonth() + monthOffset) % 12;

    const day = source.getUTCDate();

    const lastDayOfTargetMonth = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0),
    ).getUTCDate();

    const safeDay = Math.min(day, lastDayOfTargetMonth);

    return new Date(
      Date.UTC(
        targetYear,
        targetMonth,
        safeDay,
        source.getUTCHours(),
        source.getUTCMinutes(),
        source.getUTCSeconds(),
        source.getUTCMilliseconds(),
      ),
    );
  }
}
