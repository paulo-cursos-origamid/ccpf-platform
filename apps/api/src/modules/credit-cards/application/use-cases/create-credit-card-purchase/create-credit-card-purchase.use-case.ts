import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { ensureTenantCardPurchaseAccess } from '../../policies/credit-card-access.policy';
import { CreditCardInvoiceCycleService } from '../../../domain/services/credit-card-invoice-cycle.service';

export interface CreateCreditCardPurchaseInput {
  tenantId: string;
  userId: string;
  creditCardId: string;
  categoryId: string;
  subCategoryId?: string;
  title: string;
  totalAmount: string;
  purchaseDate: string;
  installmentCount: number;
  description?: string;
}

@Injectable()
export class CreateCreditCardPurchaseUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: CreateCreditCardPurchaseInput) {
    await ensureTenantCardPurchaseAccess(
      this.tenantMemberRepository,
      input.tenantId,
      input.userId,
    );

    const title = input.title.trim();

    if (title.length < 2 || title.length > 120) {
      throw new BadRequestException(
        'O título da compra deve ter entre 2 e 120 caracteres.',
      );
    }

    const purchaseDate = new Date(input.purchaseDate);

    if (Number.isNaN(purchaseDate.getTime())) {
      throw new BadRequestException('Informe uma data de compra válida.');
    }

    const amountText = input.totalAmount.trim();
    let installmentAmounts: string[];

    try {
      const total = new Prisma.Decimal(amountText);

      if (!total.isFinite() || total.gt('9999999999.99')) {
        throw new Error('O valor total da compra é inválido.');
      }

      installmentAmounts = CreditCardInvoiceCycleService.splitAmount(
        amountText,
        input.installmentCount,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Informe um valor e uma quantidade de parcelas válidos.',
      );
    }

    const description = input.description?.trim() || null;

    return this.prisma.$transaction(async (tx) => {
      const card = await tx.creditCard.findFirst({
        where: {
          id: input.creditCardId,
          tenantId: input.tenantId,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          closingDay: true,
          dueDay: true,
        },
      });

      if (!card) {
        throw new NotFoundException(
          'Cartão ativo não encontrado neste Espaço.',
        );
      }

      const category = await tx.category.findFirst({
        where: {
          id: input.categoryId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
        select: {
          id: true,
          type: true,
        },
      });

      if (!category) {
        throw new NotFoundException(
          'Categoria não encontrada neste Espaço.',
        );
      }

      if (category.type !== 'EXPENSE') {
        throw new BadRequestException(
          'A categoria da compra deve ser do tipo despesa.',
        );
      }

      if (input.subCategoryId) {
        const subCategory = await tx.subCategory.findFirst({
          where: {
            id: input.subCategoryId,
            categoryId: category.id,
            deletedAt: null,
            category: {
              tenantId: input.tenantId,
              deletedAt: null,
            },
          },
          select: { id: true },
        });

        if (!subCategory) {
          throw new NotFoundException(
            'Subcategoria não encontrada nesta categoria.',
          );
        }
      }

      const schedules = installmentAmounts.map((amount, index) => {
        const cycle = CreditCardInvoiceCycleService.calculate({
          closingDay: card.closingDay,
          dueDay: card.dueDay,
          purchaseDate,
          installmentNumber: index + 1,
        });

        return { amount, cycle };
      });

      const purchase = await tx.creditCardPurchase.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          creditCardId: card.id,
          categoryId: category.id,
          subCategoryId: input.subCategoryId ?? null,
          title,
          totalAmount: new Prisma.Decimal(amountText),
          purchaseDate,
          installmentCount: input.installmentCount,
          description,
        },
        select: { id: true },
      });

      const cyclesByMonth = new Map<
        string,
        (typeof schedules)[number]['cycle']
      >();

      for (const schedule of schedules) {
        const monthKey = schedule.cycle.referenceMonth.toISOString();
        cyclesByMonth.set(monthKey, schedule.cycle);
      }

      const invoicesByMonth = new Map<
        string,
        { id: string; dueDate: Date }
      >();

      for (const [monthKey, cycle] of cyclesByMonth) {
        const invoice = await tx.creditCardInvoice.upsert({
          where: {
            tenantId_creditCardId_referenceMonth: {
              tenantId: input.tenantId,
              creditCardId: card.id,
              referenceMonth: cycle.referenceMonth,
            },
          },
          update: {},
          create: {
            tenantId: input.tenantId,
            creditCardId: card.id,
            referenceMonth: cycle.referenceMonth,
            closingDate: cycle.closingDate,
            dueDate: cycle.dueDate,
          },
          select: {
            id: true,
            status: true,
            dueDate: true,
          },
        });

        if (invoice.status !== 'OPEN') {
          throw new BadRequestException(
            'Não é possível adicionar compras a uma fatura fechada ou paga.',
          );
        }

        invoicesByMonth.set(monthKey, {
          id: invoice.id,
          dueDate: invoice.dueDate,
        });
      }

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

      // Consolida uma obrigação por fatura, considerando todas as parcelas
      // já vinculadas à fatura, e não apenas as parcelas desta compra.
      for (const [monthKey, invoice] of invoicesByMonth) {
        const invoiceId = invoice.id;
        const cycle = cyclesByMonth.get(monthKey);

        if (!cycle) {
          throw new Error('Ciclo não encontrado para a obrigação da fatura.');
        }

        const invoiceTotal = await tx.creditCardInstallment.aggregate({
          where: {
            tenantId: input.tenantId,
            invoiceId,
          },
          _sum: {
            amount: true,
          },
        });

        const totalAmount = invoiceTotal._sum.amount;

        if (!totalAmount || new Prisma.Decimal(totalAmount).lte(0)) {
          throw new BadRequestException(
            'Não foi possível calcular o valor total da fatura.',
          );
        }

        const existingObligation = await tx.financialObligation.findUnique({
          where: {
            tenantId_sourceType_sourceId: {
              tenantId: input.tenantId,
              sourceType: 'CREDIT_CARD_INVOICE',
              sourceId: invoiceId,
            },
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (
          existingObligation &&
          existingObligation.status !== 'PENDING'
        ) {
          throw new BadRequestException(
            'A obrigação desta fatura não está mais pendente e não pode receber novas compras.',
          );
        }

        const referenceMonth =
          `${String(cycle.referenceMonth.getUTCMonth() + 1).padStart(2, '0')}` +
          `/${cycle.referenceMonth.getUTCFullYear()}`;

        const obligationTitle =
          `Fatura ${card.name} ${referenceMonth}`;

        const obligationData = {
          accountId: null,
          categoryId: null,
          subCategoryId: null,
          type: 'PAYABLE' as const,
          title: obligationTitle,
          amount: new Prisma.Decimal(totalAmount),
          dueDate: invoice.dueDate,
          description: `Fatura do cartão ${card.name}.`,
        };

        if (existingObligation) {
          await tx.financialObligation.update({
            where: {
              id: existingObligation.id,
            },
            data: obligationData,
          });
        } else {
          await tx.financialObligation.create({
            data: {
              tenantId: input.tenantId,
              userId: input.userId,
              ...obligationData,
              status: 'PENDING',
              sourceType: 'CREDIT_CARD_INVOICE',
              sourceId: invoiceId,
              counterparty: null,
            },
          });
        }
      }

      return tx.creditCardPurchase.findFirstOrThrow({
        where: {
          id: purchase.id,
          tenantId: input.tenantId,
        },
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
    });
  }
}
