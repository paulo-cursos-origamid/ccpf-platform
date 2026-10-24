import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerEntryType, LedgerReferenceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ReverseTransferUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: { id: string; tenantId: string; userId: string }) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findFirst({
        where: { id: input.id, tenantId: input.tenantId, deletedAt: null },
      });
      if (!transfer) {
        throw new NotFoundException(
          'Transferência não encontrada neste Espaço.',
        );
      }

      const [fromAccount, toAccount] = await Promise.all([
        tx.account.findFirst({
          where: { id: transfer.fromAccountId, tenantId: input.tenantId },
        }),
        tx.account.findFirst({
          where: { id: transfer.toAccountId, tenantId: input.tenantId },
        }),
      ]);
      if (!fromAccount || !toAccount) {
        throw new ConflictException(
          'Uma das contas originais da transferência não existe neste Espaço.',
        );
      }

      const originals = await tx.ledgerEntry.findMany({
        where: {
          tenantId: input.tenantId,
          referenceId: transfer.id,
          referenceType: LedgerReferenceType.TRANSFER,
        },
      });
      const debit = originals.find(
        (e) =>
          e.accountId === fromAccount.id && e.type === LedgerEntryType.DEBIT,
      );
      const credit = originals.find(
        (e) =>
          e.accountId === toAccount.id && e.type === LedgerEntryType.CREDIT,
      );
      const amount = new Prisma.Decimal(transfer.amount);

      if (
        originals.length !== 2 ||
        !debit ||
        !credit ||
        !debit.amount.equals(amount) ||
        !credit.amount.equals(amount)
      ) {
        throw new ConflictException(
          'Os lançamentos originais da transferência estão ausentes ou inconsistentes.',
        );
      }
      if (debit.reversedAt || credit.reversedAt) {
        throw new ConflictException('Esta transferência já foi estornada.');
      }

      const marked = await tx.ledgerEntry.updateMany({
        where: {
          tenantId: input.tenantId,
          id: { in: [debit.id, credit.id] },
          reversedAt: null,
        },
        data: { reversedAt: new Date() },
      });
      if (marked.count !== 2) {
        throw new ConflictException(
          'A transferência já foi estornada ou alterada.',
        );
      }

      const reversalDebit = await tx.ledgerEntry.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          accountId: fromAccount.id,
          type: LedgerEntryType.CREDIT,
          amount: debit.amount,
          description: `Estorno da transferência ${transfer.id}`,
          referenceId: debit.id,
          referenceType: LedgerReferenceType.REVERSAL,
          reversalOfId: debit.id,
        },
      });
      const reversalCredit = await tx.ledgerEntry.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          accountId: toAccount.id,
          type: LedgerEntryType.DEBIT,
          amount: credit.amount,
          description: `Estorno da transferência ${transfer.id}`,
          referenceId: credit.id,
          referenceType: LedgerReferenceType.REVERSAL,
          reversalOfId: credit.id,
        },
      });

      const [fromBalance, toBalance] = await Promise.all([
        tx.account.updateMany({
          where: { id: fromAccount.id, tenantId: input.tenantId },
          data: { balance: { increment: amount } },
        }),
        tx.account.updateMany({
          where: { id: toAccount.id, tenantId: input.tenantId },
          data: { balance: { decrement: amount } },
        }),
      ]);
      if (fromBalance.count !== 1 || toBalance.count !== 1) {
        throw new ConflictException('Não foi possível atualizar os saldos.');
      }

      const deleted = await tx.transfer.updateMany({
        where: {
          id: transfer.id,
          tenantId: input.tenantId,
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      });
      if (deleted.count !== 1) {
        throw new ConflictException('A transferência já foi alterada.');
      }

      return {
        transferId: transfer.id,
        reversalEntryIds: [reversalDebit.id, reversalCredit.id],
      };
    });
  }
}
