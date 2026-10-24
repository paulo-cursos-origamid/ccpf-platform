import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LedgerEntryType, LedgerReferenceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface CreateTransferInput {
  tenantId: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  description?: string;
}

@Injectable()
export class CreateTransferUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: CreateTransferInput) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(input.amount)) {
      throw new BadRequestException(
        'O valor deve ser um número positivo válido.',
      );
    }

    const amount = new Prisma.Decimal(input.amount);

    if (!amount.isFinite() || amount.lte(0)) {
      throw new BadRequestException('O valor deve ser maior que zero.');
    }

    if (input.fromAccountId === input.toAccountId) {
      throw new BadRequestException(
        'A conta de origem e a conta de destino devem ser diferentes.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const accountIds = [input.fromAccountId, input.toAccountId];

      const accounts = await tx.account.findMany({
        where: {
          id: { in: accountIds },
          tenantId: input.tenantId,
          archivedAt: null,
        },
      });

      const fromAccount = accounts.find(
        (account) => account.id === input.fromAccountId,
      );
      const toAccount = accounts.find(
        (account) => account.id === input.toAccountId,
      );

      if (!fromAccount || !toAccount) {
        throw new NotFoundException(
          'Conta de origem ou destino não encontrada neste Espaço.',
        );
      }

      const memberships = await tx.accountMember.findMany({
        where: {
          accountId: { in: accountIds },
          userId: input.userId,
          status: 'ACTIVE',
        },
      });

      const accessibleAccountIds = new Set(
        memberships.map((membership) => membership.accountId),
      );

      if (
        !accessibleAccountIds.has(fromAccount.id) ||
        !accessibleAccountIds.has(toAccount.id)
      ) {
        throw new ForbiddenException(
          'Você precisa ter acesso ativo às duas contas.',
        );
      }

      const transfer = await tx.transfer.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          fromAccountId: fromAccount.id,
          toAccountId: toAccount.id,
          amount,
          description: input.description?.trim() || null,
        },
      });

      const description =
        input.description?.trim() || 'Transferência entre contas';

      await tx.ledgerEntry.createMany({
        data: [
          {
            tenantId: input.tenantId,
            userId: input.userId,
            accountId: fromAccount.id,
            type: LedgerEntryType.DEBIT,
            amount,
            description,
            referenceId: transfer.id,
            referenceType: LedgerReferenceType.TRANSFER,
          },
          {
            tenantId: input.tenantId,
            userId: input.userId,
            accountId: toAccount.id,
            type: LedgerEntryType.CREDIT,
            amount,
            description,
            referenceId: transfer.id,
            referenceType: LedgerReferenceType.TRANSFER,
          },
        ],
      });

      const debit = await tx.account.updateMany({
        where: {
          id: fromAccount.id,
          tenantId: input.tenantId,
          archivedAt: null,
        },
        data: { balance: { decrement: amount } },
      });

      if (debit.count !== 1) {
        throw new NotFoundException(
          'A conta de origem não está mais disponível.',
        );
      }

      const credit = await tx.account.updateMany({
        where: {
          id: toAccount.id,
          tenantId: input.tenantId,
          archivedAt: null,
        },
        data: { balance: { increment: amount } },
      });

      if (credit.count !== 1) {
        throw new NotFoundException(
          'A conta de destino não está mais disponível.',
        );
      }

      return transfer;
    });
  }
}
