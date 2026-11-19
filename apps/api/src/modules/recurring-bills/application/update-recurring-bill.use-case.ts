import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

interface UpdateRecurringBillInput {
  tenantId: string;
  userId: string;
  recurringBillId: string;
  dueDay: number;
  expectedAmount?: string;
}

function dateAtUtcDay(year: number, month: number, day: number): Date {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

@Injectable()
export class UpdateRecurringBillUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: UpdateRecurringBillInput) {
    if (
      !Number.isInteger(input.dueDay) ||
      input.dueDay < 1 ||
      input.dueDay > 31
    ) {
      throw new BadRequestException('Dia de vencimento inválido.');
    }

    let expectedAmount: Prisma.Decimal | undefined;
    if (input.expectedAmount !== undefined) {
      if (!/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/.test(input.expectedAmount)) {
        throw new BadRequestException('Valor previsto inválido.');
      }

      expectedAmount = new Prisma.Decimal(input.expectedAmount);
      if (!expectedAmount.isFinite() || expectedAmount.lte(0)) {
        throw new BadRequestException('Valor previsto inválido.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.recurringBill.findFirst({
        where: {
          id: input.recurringBillId,
          tenantId: input.tenantId,
          account: {
            archivedAt: null,
            accountMembers: {
              some: {
                userId: input.userId,
                status: 'ACTIVE',
                role: { not: 'VIEWER' },
              },
            },
          },
        },
        include: {
          occurrences: {
            where: {
              status: 'PENDING',
              transactionId: null,
            },
            select: {
              id: true,
              dueDate: true,
              referenceMonth: true,
              expectedAmount: true,
            },
          },
        },
      });

      if (!bill) {
        throw new NotFoundException(
          'Conta recorrente não encontrada ou sem acesso.',
        );
      }

      if (bill.userId !== input.userId) {
        throw new ForbiddenException(
          'Somente quem cadastrou a conta recorrente pode editá-la.',
        );
      }

      const todayInBrazil = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const overdue = bill.occurrences.some((occurrence) => {
        const dueDate = occurrence.dueDate.toISOString().slice(0, 10);
        return dueDate < todayInBrazil;
      });

      if (overdue) {
        throw new ForbiddenException(
          'Não é possível editar uma conta recorrente com vencimento pendente atrasado.',
        );
      }

      const updated = await tx.recurringBill.update({
        where: {
          id_tenantId: {
            id: bill.id,
            tenantId: input.tenantId,
          },
        },
        data: {
          dueDay: input.dueDay,
          ...(expectedAmount ? { expectedAmount } : {}),
        },
      });

      await Promise.all(
        bill.occurrences.map(async (occurrence) => {
          const referenceMonth = occurrence.referenceMonth;
          const dueDate = dateAtUtcDay(
            referenceMonth.getUTCFullYear(),
            referenceMonth.getUTCMonth(),
            input.dueDay,
          );

          const updatedOccurrence = await tx.recurringBillOccurrence.updateMany(
            {
              where: {
                id: occurrence.id,
                tenantId: input.tenantId,
                recurringBillId: bill.id,
                status: 'PENDING',
                transactionId: null,
              },
              data: {
                dueDate,
                ...(expectedAmount ? { expectedAmount } : {}),
              },
            },
          );

          if (updatedOccurrence.count !== 1) {
            return;
          }

          // Só sincroniza compromissos ainda abertos e sem histórico de liquidação.
          await tx.financialObligation.updateMany({
            where: {
              tenantId: input.tenantId,
              sourceType: 'RECURRING_BILL_OCCURRENCE',
              sourceId: occurrence.id,
              status: 'PENDING',
              settlements: { none: {} },
            },
            data: {
              dueDate,
              ...(expectedAmount ? { amount: expectedAmount } : {}),
            },
          });
        }),
      );

      return updated;
    });
  }
}
