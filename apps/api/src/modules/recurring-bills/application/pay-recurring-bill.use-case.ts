import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryType,
  LedgerEntryType,
  LedgerReferenceType,
  Prisma,
  RecurringBillOccurrenceStatus,
  TransactionType,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { runSerializableTransaction } from '../../transactions/application/run-serializable-transaction';

export interface PayRecurringBillInput {
  tenantId: string;
  userId: string;
  recurringBillId: string;
  occurrenceId: string;
  amount: string;
  paidAt: string;
  description?: string;
}

@Injectable()
export class PayRecurringBillUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: PayRecurringBillInput) {
    if (!/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/.test(input.amount)) {
      throw new BadRequestException('Valor do pagamento inválido.');
    }

    const amount = new Prisma.Decimal(input.amount);

    if (!amount.isFinite() || amount.lte(0)) {
      throw new BadRequestException(
        'O valor do pagamento deve ser maior que zero.',
      );
    }

    const paidAt = new Date(input.paidAt);

    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException('Data do pagamento inválida.');
    }

    return runSerializableTransaction(
      this.prisma,
      async (tx) => {
        const occurrence = await tx.recurringBillOccurrence.findFirst({
          where: {
            id: input.occurrenceId,
            tenantId: input.tenantId,
            recurringBillId: input.recurringBillId,
          },
          include: {
            recurringBill: true,
          },
        });

        if (!occurrence) {
          throw new NotFoundException(
            'Vencimento não encontrado neste Espaço.',
          );
        }

        if (occurrence.status !== RecurringBillOccurrenceStatus.PENDING ||
            occurrence.transactionId !== null) {
          throw new ConflictException(
            'Este vencimento já foi pago ou cancelado.',
          );
        }

        const bill = occurrence.recurringBill;

        const account = await tx.account.findFirst({
          where: {
            id: bill.accountId,
            tenantId: input.tenantId,
            archivedAt: null,
          },
        });

        if (!account) {
          throw new NotFoundException(
            'Conta financeira não encontrada neste Espaço.',
          );
        }

        const membership = await tx.accountMember.findFirst({
          where: {
            accountId: account.id,
            userId: input.userId,
            status: 'ACTIVE',
          },
        });

        if (!membership) {
          throw new ForbiddenException(
            'Você não tem acesso ativo a esta conta.',
          );
        }

        if (membership.role === 'VIEWER') {
          throw new ForbiddenException(
            'Você não tem permissão para registrar pagamentos.',
          );
        }

        const category = await tx.category.findFirst({
          where: {
            id: bill.categoryId,
            tenantId: input.tenantId,
            deletedAt: null,
          },
        });

        if (!category || category.type !== CategoryType.EXPENSE) {
          throw new BadRequestException(
            'A categoria de despesa não está disponível.',
          );
        }

        if (bill.subCategoryId) {
          const subCategory = await tx.subCategory.findFirst({
            where: {
              id: bill.subCategoryId,
              categoryId: bill.categoryId,
              deletedAt: null,
            },
          });

          if (!subCategory) {
            throw new BadRequestException(
              'A subcategoria não está disponível.',
            );
          }
        }

        // Reserva o vencimento dentro da transação Serializable.
        // Uma segunda tentativa não poderá confirmar o mesmo pagamento.
        const reserved = await tx.recurringBillOccurrence.updateMany({
          where: {
            id: occurrence.id,
            tenantId: input.tenantId,
            recurringBillId: bill.id,
            status: RecurringBillOccurrenceStatus.PENDING,
            transactionId: null,
          },
          data: {
            status: RecurringBillOccurrenceStatus.PAID,
            paidAmount: amount,
            paidAt,
          },
        });

        if (reserved.count !== 1) {
          throw new ConflictException(
            'Este vencimento já foi processado.',
          );
        }

        const description =
          input.description?.trim() ||
          bill.description?.trim() ||
          bill.title;

        const transaction = await tx.transaction.create({
          data: {
            tenantId: input.tenantId,
            userId: input.userId,
            accountId: account.id,
            categoryId: category.id,
            subCategoryId: bill.subCategoryId,
            title: bill.title,
            amount,
            type: TransactionType.EXPENSE,
            date: paidAt,
            description,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            tenantId: input.tenantId,
            userId: input.userId,
            accountId: account.id,
            type: LedgerEntryType.DEBIT,
            amount,
            description,
            referenceId: transaction.id,
            referenceType: LedgerReferenceType.TRANSACTION,
          },
        });

        const updatedAccount = await tx.account.updateMany({
          where: {
            id: account.id,
            tenantId: input.tenantId,
            archivedAt: null,
          },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        if (updatedAccount.count !== 1) {
          throw new ConflictException(
            'Não foi possível atualizar o saldo da conta.',
          );
        }

        const linked = await tx.recurringBillOccurrence.updateMany({
          where: {
            id: occurrence.id,
            tenantId: input.tenantId,
            recurringBillId: bill.id,
            status: RecurringBillOccurrenceStatus.PAID,
            transactionId: null,
          },
          data: {
            transactionId: transaction.id,
          },
        });

        if (linked.count !== 1) {
          throw new ConflictException(
            'Não foi possível vincular o pagamento ao vencimento.',
          );
        }

        return {
          occurrenceId: occurrence.id,
          recurringBillId: bill.id,
          transactionId: transaction.id,
          status: RecurringBillOccurrenceStatus.PAID,
          paidAmount: amount.toString(),
          paidAt,
        };
      },
      'Conflito ao registrar o pagamento. Tente novamente.',
    );
  }
}
