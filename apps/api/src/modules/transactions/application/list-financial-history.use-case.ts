import { Injectable } from '@nestjs/common';
import { LedgerReferenceType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ListFinancialHistoryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string, userId: string) {
    const [transactions, transfers] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          tenantId,
          account: {
            accountMembers: {
              some: { userId, status: 'ACTIVE' },
            },
          },
        },
        include: {
          account: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.transfer.findMany({
        where: {
          tenantId,
          fromAccount: {
            accountMembers: {
              some: { userId, status: 'ACTIVE' },
            },
          },
          toAccount: {
            accountMembers: {
              some: { userId, status: 'ACTIVE' },
            },
          },
        },
        include: {
          fromAccount: { select: { id: true, name: true } },
          toAccount: { select: { id: true, name: true } },
        },
      }),
    ]);

    const transactionIds = transactions.map((item) => item.id);
    const transferIds = transfers.map((item) => item.id);

    const [installments, recurringOccurrences] = await Promise.all([
      this.prisma.installment.findMany({
        where: {
          tenantId,
          transactionId: { in: transactionIds },
        },
        select: {
          transactionId: true,
          installmentNumber: true,
          plan: {
            select: {
              title: true,
              installmentCount: true,
            },
          },
        },
      }),
      this.prisma.recurringBillOccurrence.findMany({
        where: {
          tenantId,
          transactionId: { in: transactionIds },
        },
        select: {
          transactionId: true,
          recurringBill: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    const installmentByTransaction = new Map(
      installments.map((item) => [item.transactionId, item]),
    );

    const recurringByTransaction = new Map(
      recurringOccurrences.map((item) => [item.transactionId, item]),
    );

    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        tenantId,
        OR: [
          {
            referenceType: LedgerReferenceType.TRANSACTION,
            referenceId: { in: transactionIds },
          },
          {
            referenceType: LedgerReferenceType.TRANSFER,
            referenceId: { in: transferIds },
          },
        ],
      },
      select: {
        referenceId: true,
        referenceType: true,
        reversedAt: true,
      },
    });

    const transactionLedger = new Map(
      ledgerEntries
        .filter((entry) => entry.referenceType === LedgerReferenceType.TRANSACTION)
        .map((entry) => [entry.referenceId, entry]),
    );

    const transferLedger = new Map<string, typeof ledgerEntries>();
    for (const entry of ledgerEntries) {
      if (entry.referenceType !== LedgerReferenceType.TRANSFER) continue;
      const entries = transferLedger.get(entry.referenceId) ?? [];
      entries.push(entry);
      transferLedger.set(entry.referenceId, entries);
    }

    const transactionItems = transactions.flatMap((item) => {
      const original = transactionLedger.get(item.id);
      const reversed = original?.reversedAt != null;

      const installment = installmentByTransaction.get(item.id);
      const recurring = recurringByTransaction.get(item.id);

      const origin = installment
        ? 'INSTALLMENT' as const
        : recurring
          ? 'RECURRING_BILL' as const
          : 'MANUAL' as const;

      const originDescription = installment
        ? `Parcela ${installment.installmentNumber}/${installment.plan.installmentCount} · ${installment.plan.title}`
        : recurring
          ? `Conta recorrente · ${recurring.recurringBill.title}`
          : null;

      // Não exibe registros excluídos sem estorno correspondente.
      if (item.deletedAt && !reversed) return [];

      return [{
        id: item.id,
        operationType: 'TRANSACTION' as const,
        origin,
        originDescription,
        title: item.title,
        description: item.description,
        date: item.date,
        amount: item.amount.toString(),
        direction: item.type,
        accountName: item.account.name,
        categoryName: item.category.name,
        fromAccountName: null,
        toAccountName: null,
        status: reversed ? 'REVERSED' as const : 'COMPLETED' as const,
      }];
    });

    const transferItems = transfers.flatMap((item) => {
      const originals = transferLedger.get(item.id) ?? [];
      const reversed =
        originals.length === 2 &&
        originals.every((entry) => entry.reversedAt != null);

      if (item.deletedAt && !reversed) return [];

      return [{
        id: item.id,
        operationType: 'TRANSFER' as const,
        origin: 'TRANSFER' as const,
        originDescription: null,
        title: item.description || 'Transferência entre contas',
        description: item.description,
        date: item.createdAt,
        amount: item.amount.toString(),
        direction: 'TRANSFER' as const,
        accountName: null,
        categoryName: null,
        fromAccountName: item.fromAccount.name,
        toAccountName: item.toAccount.name,
        status: reversed ? 'REVERSED' as const : 'COMPLETED' as const,
      }];
    });

    return [...transactionItems, ...transferItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }
}
