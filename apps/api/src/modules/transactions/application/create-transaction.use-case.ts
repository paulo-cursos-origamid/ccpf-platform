import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LedgerEntryType,
  LedgerReferenceType,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface CreateTransactionInput {
  tenantId: string;
  userId: string;
  accountId: string;
  categoryId: string;
  subCategoryId?: string;
  title: string;
  amount: string;
  type: TransactionType;
  date: string;
  description?: string;
}

@Injectable()
export class CreateTransactionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: CreateTransactionInput) {
    const amount = new Prisma.Decimal(input.amount);

    if (!amount.isFinite() || amount.lte(0)) {
      throw new BadRequestException('O valor deve ser maior que zero.');
    }

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: {
          id: input.accountId,
          tenantId: input.tenantId,
          archivedAt: null,
        },
      });

      if (!account) {
        throw new NotFoundException('Conta não encontrada neste Espaço.');
      }

      const membership = await tx.accountMember.findFirst({
        where: {
          accountId: account.id,
          userId: input.userId,
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new ForbiddenException('Você não tem acesso a esta conta.');
      }

      const category = await tx.category.findFirst({
        where: {
          id: input.categoryId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada neste Espaço.');
      }

      if (category.type !== input.type) {
        throw new BadRequestException(
          'O tipo da transação deve corresponder ao tipo da categoria.',
        );
      }

      if (input.subCategoryId) {
        const subCategory = await tx.subCategory.findFirst({
          where: {
            id: input.subCategoryId,
            categoryId: category.id,
            deletedAt: null,
          },
        });

        if (!subCategory) {
          throw new NotFoundException(
            'Subcategoria não encontrada nesta categoria.',
          );
        }
      }

      const transaction = await tx.transaction.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          accountId: account.id,
          categoryId: category.id,
          subCategoryId: input.subCategoryId ?? null,
          title: input.title.trim(),
          amount,
          type: input.type,
          date: new Date(input.date),
          description: input.description?.trim() || null,
        },
      });

      const ledgerType =
        input.type === TransactionType.INCOME
          ? LedgerEntryType.CREDIT
          : LedgerEntryType.DEBIT;

      await tx.ledgerEntry.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          accountId: account.id,
          type: ledgerType,
          amount,
          description: input.description?.trim() || input.title.trim(),
          referenceId: transaction.id,
          referenceType: LedgerReferenceType.TRANSACTION,
        },
      });

      const updated = await tx.account.updateMany({
        where: {
          id: account.id,
          tenantId: input.tenantId,
          archivedAt: null,
        },
        data: {
          balance:
            input.type === TransactionType.INCOME
              ? { increment: amount }
              : { decrement: amount },
        },
      });

      if (updated.count !== 1) {
        throw new NotFoundException('A conta não está mais disponível.');
      }

      return transaction;
    });
  }
}
