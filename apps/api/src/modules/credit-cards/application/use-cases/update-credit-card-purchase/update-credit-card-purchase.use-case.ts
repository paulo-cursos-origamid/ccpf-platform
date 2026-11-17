import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreditCardInvoiceStatus,
  FinancialObligationSourceType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { ensureTenantCardPurchaseAccess } from '../../policies/credit-card-access.policy';
import { CreditCardInvoiceCycleService } from '../../../domain/services/credit-card-invoice-cycle.service';

/** Values the author may correct before the first card installment is due. */
export interface UpdateCreditCardPurchaseInput {
  tenantId: string;
  userId: string;
  creditCardId: string;
  purchaseId: string;
  totalAmount: string;
  installmentCount: number;
}

@Injectable()
export class UpdateCreditCardPurchaseUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: UpdateCreditCardPurchaseInput) {
    await ensureTenantCardPurchaseAccess(
      this.tenantMemberRepository,
      input.tenantId,
      input.userId,
    );

    let installmentAmounts: string[];
    try {
      const total = new Prisma.Decimal(input.totalAmount.trim());
      if (!total.isFinite() || total.gt('9999999999.99')) {
        throw new Error('O valor total da compra é inválido.');
      }
      installmentAmounts = CreditCardInvoiceCycleService.splitAmount(
        input.totalAmount,
        input.installmentCount,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Informe um valor e uma quantidade de parcelas válidos.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const purchase = await tx.creditCardPurchase.findFirst({
          where: {
            id: input.purchaseId,
            tenantId: input.tenantId,
            creditCardId: input.creditCardId,
          },
          include: {
            creditCard: {
              select: {
                id: true,
                name: true,
                closingDay: true,
                dueDay: true,
              },
            },
            installments: {
              orderBy: { installmentNumber: 'asc' },
              include: {
                invoice: {
                  select: {
                    id: true,
                    status: true,
                    dueDate: true,
                    referenceMonth: true,
                  },
                },
              },
            },
          },
        });

        if (!purchase) {
          throw new NotFoundException('Compra não encontrada neste Espaço.');
        }
        if (purchase.userId !== input.userId) {
          throw new ForbiddenException(
            'Somente quem registrou a compra pode alterá-la.',
          );
        }

        const firstInstallment = purchase.installments[0];
        if (!firstInstallment) {
          throw new ConflictException(
            'A compra não possui parcelas que possam ser alteradas.',
          );
        }
        if (firstInstallment.dueDate.getTime() <= Date.now()) {
          throw new ConflictException(
            'A compra só pode ser alterada antes do vencimento da primeira parcela.',
          );
        }

        if (
          purchase.installments.some((item) => item.invoice.status !== 'OPEN')
        ) {
          throw new ConflictException(
            'A compra só pode ser alterada enquanto todas as faturas envolvidas estiverem abertas.',
          );
        }

        const oldInvoiceIds = Array.from(
          new Set(purchase.installments.map((item) => item.invoiceId)),
        );
        const oldInvoices = new Map(
          purchase.installments.map((item) => [item.invoice.id, item.invoice]),
        );

        const schedules = installmentAmounts.map((amount, index) => {
          const cycle = CreditCardInvoiceCycleService.calculate({
            closingDay: purchase.creditCard.closingDay,
            dueDay: purchase.creditCard.dueDay,
            purchaseDate: purchase.purchaseDate,
            installmentNumber: index + 1,
          });
          return { amount, cycle };
        });

        const cyclesByMonth = new Map<
          string,
          (typeof schedules)[number]['cycle']
        >();
        for (const schedule of schedules) {
          cyclesByMonth.set(
            schedule.cycle.referenceMonth.toISOString(),
            schedule.cycle,
          );
        }

        const invoicesByMonth = new Map<
          string,
          {
            id: string;
            dueDate: Date;
            referenceMonth: Date;
            status: CreditCardInvoiceStatus;
          }
        >();
        for (const [monthKey, cycle] of cyclesByMonth) {
          const invoice = await tx.creditCardInvoice.upsert({
            where: {
              tenantId_creditCardId_referenceMonth: {
                tenantId: input.tenantId,
                creditCardId: purchase.creditCardId,
                referenceMonth: cycle.referenceMonth,
              },
            },
            update: {},
            create: {
              tenantId: input.tenantId,
              creditCardId: purchase.creditCardId,
              referenceMonth: cycle.referenceMonth,
              closingDate: cycle.closingDate,
              dueDate: cycle.dueDate,
            },
            select: {
              id: true,
              status: true,
              dueDate: true,
              referenceMonth: true,
            },
          });

          if (invoice.status !== 'OPEN') {
            throw new ConflictException(
              'A compra só pode ser alterada enquanto todas as faturas envolvidas estiverem abertas.',
            );
          }
          invoicesByMonth.set(monthKey, invoice);
        }

        const affectedInvoiceIds = Array.from(
          new Set([
            ...oldInvoiceIds,
            ...Array.from(invoicesByMonth.values(), (invoice) => invoice.id),
          ]),
        );
        const obligations = await tx.financialObligation.findMany({
          where: {
            tenantId: input.tenantId,
            sourceType: FinancialObligationSourceType.CREDIT_CARD_INVOICE,
            sourceId: { in: affectedInvoiceIds },
          },
          select: {
            id: true,
            sourceId: true,
            status: true,
            settlements: { select: { id: true } },
          },
        });
        if (
          obligations.some(
            (obligation) =>
              obligation.status !== 'PENDING' ||
              obligation.settlements.length > 0,
          )
        ) {
          throw new ConflictException(
            'A compra não pode ser alterada porque uma das faturas já recebeu pagamento.',
          );
        }

        await tx.creditCardInstallment.deleteMany({
          where: {
            tenantId: input.tenantId,
            purchaseId: purchase.id,
          },
        });

        await tx.creditCardInstallment.createMany({
          data: schedules.map((schedule, index) => {
            const monthKey = schedule.cycle.referenceMonth.toISOString();
            const invoice = invoicesByMonth.get(monthKey);
            if (!invoice) {
              throw new Error(
                'Fatura não encontrada para a parcela calculada.',
              );
            }
            return {
              tenantId: input.tenantId,
              purchaseId: purchase.id,
              invoiceId: invoice.id,
              installmentNumber: index + 1,
              amount: new Prisma.Decimal(schedule.amount),
              dueDate: invoice.dueDate,
            };
          }),
        });

        await tx.creditCardPurchase.update({
          where: { id: purchase.id },
          data: {
            totalAmount: new Prisma.Decimal(input.totalAmount),
            installmentCount: input.installmentCount,
          },
        });

        const obligationsByInvoice = new Map(
          obligations.map((obligation) => [obligation.sourceId, obligation]),
        );
        const invoiceRecords = new Map(oldInvoices);
        for (const invoice of invoicesByMonth.values()) {
          invoiceRecords.set(invoice.id, invoice);
        }

        for (const invoiceId of affectedInvoiceIds) {
          const invoice = invoiceRecords.get(invoiceId);
          if (!invoice) continue;

          const aggregate = await tx.creditCardInstallment.aggregate({
            where: { tenantId: input.tenantId, invoiceId },
            _sum: { amount: true },
          });
          const amount = aggregate._sum.amount;
          const obligation = obligationsByInvoice.get(invoiceId);

          if (!amount || new Prisma.Decimal(amount).lte(0)) {
            if (obligation) {
              await tx.financialObligation.delete({
                where: { id: obligation.id },
              });
            }
            continue;
          }

          const cycle = invoice.referenceMonth;
          const referenceMonth =
            `${String(cycle.getUTCMonth() + 1).padStart(2, '0')}` +
            `/${cycle.getUTCFullYear()}`;
          const obligationData = {
            amount: new Prisma.Decimal(amount),
            dueDate: invoice.dueDate,
            title: `Fatura ${purchase.creditCard.name} ${referenceMonth}`,
            description: `Fatura do cartão ${purchase.creditCard.name}.`,
          };

          if (obligation) {
            await tx.financialObligation.update({
              where: { id: obligation.id },
              data: obligationData,
            });
          } else {
            await tx.financialObligation.create({
              data: {
                tenantId: input.tenantId,
                userId: purchase.userId,
                accountId: null,
                categoryId: null,
                subCategoryId: null,
                type: 'PAYABLE',
                status: 'PENDING',
                sourceType: FinancialObligationSourceType.CREDIT_CARD_INVOICE,
                sourceId: invoiceId,
                counterparty: null,
                ...obligationData,
              },
            });
          }
        }

        return tx.creditCardPurchase.findFirstOrThrow({
          where: { id: purchase.id, tenantId: input.tenantId },
          include: {
            installments: {
              orderBy: { installmentNumber: 'asc' },
              include: {
                invoice: {
                  select: {
                    id: true,
                    referenceMonth: true,
                    closingDate: true,
                    dueDate: true,
                    status: true,
                  },
                },
              },
            },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
