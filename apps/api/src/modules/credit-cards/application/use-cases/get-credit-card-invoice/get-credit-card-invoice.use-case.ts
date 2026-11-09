import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import {
  creditCardInvoiceDetailsInclude,
  creditCardInvoiceObligationSelect,
  presentCreditCardInvoice,
} from '../../presenters/credit-card-invoice.presenter';

export interface GetCreditCardInvoiceInput {
  invoiceId: string;
  tenantId: string;
}

@Injectable()
export class GetCreditCardInvoiceUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: GetCreditCardInvoiceInput) {
    const invoice = await this.prisma.creditCardInvoice.findFirst({
      where: {
        id: input.invoiceId,
        tenantId: input.tenantId,
      },
      include: creditCardInvoiceDetailsInclude,
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada neste Espaço.');
    }

    const obligation = await this.prisma.financialObligation.findFirst({
      where: {
        tenantId: input.tenantId,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: invoice.id,
      },
      select: creditCardInvoiceObligationSelect,
    });

    return presentCreditCardInvoice(invoice, obligation);
  }
}
