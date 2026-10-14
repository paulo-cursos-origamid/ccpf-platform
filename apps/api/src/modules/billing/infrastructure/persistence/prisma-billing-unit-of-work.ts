import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import {
  BillingUnitOfWork,
  BillingUnitOfWorkContext,
} from '../../domain/repositories/billing-unit-of-work';
import { PrismaInvoiceRepository } from './prisma-invoice.repository';
import { PrismaPaymentRepository } from './prisma-payment.repository';
import { PrismaInvoiceInstallmentRepository } from './prisma-invoice-installment.repository';
import { PrismaSubscriptionRepository } from './prisma-subscription.repository';
import { PrismaPlanRepository } from './prisma-plan.repository';
import { PrismaPlanPriceRepository } from './prisma-plan-price.repository';

/**
 * Implementação Prisma do Unit of Work de Billing.
 *
 * Responsabilidades:
 * - abrir a transação;
 * - criar repositórios ligados ao mesmo transaction client;
 * - bloquear a Invoice durante a confirmação;
 * - executar todas as alterações dentro da mesma transação.
 */
@Injectable()
export class PrismaBillingUnitOfWork implements BillingUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T>(
    work: (context: BillingUnitOfWorkContext) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (transaction) => {
      const invoiceRepository = new PrismaInvoiceRepository(transaction);
      const paymentRepository = new PrismaPaymentRepository(transaction);
      const invoiceInstallmentRepository =
        new PrismaInvoiceInstallmentRepository(transaction);
      const subscriptionRepository = new PrismaSubscriptionRepository(
        transaction,
      );
      const planRepository = new PrismaPlanRepository(transaction);
      const planPriceRepository = new PrismaPlanPriceRepository(transaction);

      const context: BillingUnitOfWorkContext = {
        invoiceRepository,
        paymentRepository,
        invoiceInstallmentRepository,
        subscriptionRepository,
        planRepository,
        planPriceRepository,

        /**
         * O lock é aplicado à linha da Invoice para garantir
         * que confirmações concorrentes sejam serializadas.
         */
        lockInvoice: async (invoiceId: string): Promise<void> => {
          await transaction.$queryRaw(
            Prisma.sql`
              SELECT id
              FROM "Invoice"
              WHERE id = ${invoiceId}
              FOR UPDATE
            `,
          );
        },

        /**
         * O lock da Subscription serializa alterações concorrentes
         * sobre o mesmo ciclo comercial.
         */
        lockSubscription: async (subscriptionId: string): Promise<void> => {
          await transaction.$queryRaw(
            Prisma.sql`
              SELECT id
              FROM "Subscription"
              WHERE id = ${subscriptionId}
              FOR UPDATE
            `,
          );
        },
      };

      return work(context);
    });
  }
}
