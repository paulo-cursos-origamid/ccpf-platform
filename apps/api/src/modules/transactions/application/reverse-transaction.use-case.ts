import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerEntryType, LedgerReferenceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ReverseTransactionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: { id: string; tenantId: string; userId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: input.id, tenantId: input.tenantId, deletedAt: null },
      });
      if (!transaction) {
        throw new NotFoundException('Transação não encontrada neste Espaço.');
      }

      const original = await tx.ledgerEntry.findFirst({
        where: {
          tenantId: input.tenantId,
          referenceId: transaction.id,
          referenceType: LedgerReferenceType.TRANSACTION,
        },
      });

      const expectedType =
        transaction.type === 'INCOME'
          ? LedgerEntryType.CREDIT
          : LedgerEntryType.DEBIT;

      if (
        !original ||
        original.accountId !== transaction.accountId ||
        original.type !== expectedType ||
        !original.amount.equals(new Prisma.Decimal(transaction.amount))
      ) {
        throw new ConflictException(
          'O lançamento contábil original está ausente ou inconsistente.',
        );
      }
      if (original.reversedAt) {
        throw new ConflictException('Esta transação já foi estornada.');
      }

      // A conta pode ter sido arquivada após a operação original.
      // O estorno é permitido, desde que continue no Espaço correto.
      const account = await tx.account.findFirst({
        where: { id: transaction.accountId, tenantId: input.tenantId },
      });
      if (!account) {
        throw new NotFoundException('Conta original não encontrada.');
      }

      const marked = await tx.ledgerEntry.updateMany({
        where: { id: original.id, tenantId: input.tenantId, reversedAt: null },
        data: { reversedAt: new Date() },
      });
      if (marked.count !== 1) {
        throw new ConflictException('Esta transação já foi estornada.');
      }

      const reversal = await tx.ledgerEntry.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          accountId: original.accountId,
          type:
            original.type === LedgerEntryType.CREDIT
              ? LedgerEntryType.DEBIT
              : LedgerEntryType.CREDIT,
          amount: original.amount,
          description: `Estorno da transação ${transaction.id}`,
          referenceId: original.id,
          referenceType: LedgerReferenceType.REVERSAL,
          reversalOfId: original.id,
        },
      });

      const balance = await tx.account.updateMany({
        where: { id: account.id, tenantId: input.tenantId },
        data: {
          balance:
            original.type === LedgerEntryType.CREDIT
              ? { decrement: original.amount }
              : { increment: original.amount },
        },
      });
      if (balance.count !== 1) {
        throw new ConflictException('Não foi possível atualizar o saldo.');
      }

      const deleted = await tx.transaction.updateMany({
        where: {
          id: transaction.id,
          tenantId: input.tenantId,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
      if (deleted.count !== 1) {
        throw new ConflictException('A transação já foi alterada.');
      }

      return { transactionId: transaction.id, reversal };
    });
  }
}
