import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreditCardInvoiceStatus as PrismaCreditCardInvoiceStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import {
  creditCardInvoiceDetailsInclude,
  creditCardInvoiceObligationSelect,
  presentCreditCardInvoice,
} from '../../presenters/credit-card-invoice.presenter';

export interface ListCreditCardInvoicesInput {
  tenantId: string;
  creditCardId?: string;
  status?: 'OPEN' | 'CLOSED' | 'PAID';
  referenceMonthFrom?: string;
  referenceMonthTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ListCreditCardInvoicesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: ListCreditCardInvoicesInput) {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 10));
    const skip = (page - 1) * limit;

    const from = input.referenceMonthFrom
      ? new Date(input.referenceMonthFrom)
      : undefined;
    const to = input.referenceMonthTo
      ? new Date(input.referenceMonthTo)
      : undefined;

    if (from && Number.isNaN(from.getTime())) {
      throw new BadRequestException('Data inicial do período inválida.');
    }

    if (to && Number.isNaN(to.getTime())) {
      throw new BadRequestException('Data final do período inválida.');
    }

    if (from && to && from > to) {
      throw new BadRequestException(
        'A data inicial não pode ser posterior à data final.',
      );
    }

    const where: Prisma.CreditCardInvoiceWhereInput = {
      tenantId: input.tenantId,
    };

    if (input.creditCardId) {
      where.creditCardId = input.creditCardId;
    }

    if (input.status) {
      where.status = input.status as PrismaCreditCardInvoiceStatus;
    }

    if (from || to) {
      where.referenceMonth = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const [invoices, total] = await Promise.all([
      this.prisma.creditCardInvoice.findMany({
        where,
        skip,
        take: limit,
        include: creditCardInvoiceDetailsInclude,
        orderBy: [{ referenceMonth: 'desc' }, { dueDate: 'asc' }],
      }),
      this.prisma.creditCardInvoice.count({ where }),
    ]);

    if (invoices.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    const invoiceIds = invoices.map((invoice) => invoice.id);

    const obligations = await this.prisma.financialObligation.findMany({
      where: {
        tenantId: input.tenantId,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: { in: invoiceIds },
      },
      select: creditCardInvoiceObligationSelect,
    });

    const obligationsByInvoiceId = new Map(
      obligations
        .filter((obligation) => obligation.sourceId !== null)
        .map((obligation) => [obligation.sourceId as string, obligation]),
    );

    return {
      data: invoices.map((invoice) =>
        presentCreditCardInvoice(
          invoice,
          obligationsByInvoiceId.get(invoice.id),
        ),
      ),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
