import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InstallmentStatus,
  LedgerEntryType,
  LedgerReferenceType,
  Prisma,
  TransactionType,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { runSerializableTransaction } from '../run-serializable-transaction';

export interface PayInstallmentInput {
  tenantId: string;
  userId: string;
  installmentPlanId: string;
  installmentId: string;
  paidAt: string;
}

@Injectable()
export class PayInstallmentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: PayInstallmentInput) {
    const paidAt = new Date(input.paidAt);

    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException('Data de pagamento inválida.');
    }

    return runSerializableTransaction(
      this.prisma,
      async (tx) => {
        const installment = await tx.installment.findFirst({
          where: {
            id: input.installmentId,
            tenantId: input.tenantId,
            installmentPlanId: input.installmentPlanId,
          },
          include: {
            plan: true,
          },
        });

        if (!installment || installment.plan.deletedAt) {
          throw new NotFoundException('Parcela não encontrada.');
        }

        if (
          installment.status !== InstallmentStatus.PENDING ||
          installment.transactionId
        ) {
          throw new ConflictException(
            'Esta parcela não está disponível para pagamento.',
          );
        }

        const plan = installment.plan;

        const account = await tx.account.findFirst({
          where: {
            id: plan.accountId,
            tenantId: input.tenantId,
            archivedAt: null,
          },
        });

        if (!account) {
          throw new NotFoundException('Conta financeira não encontrada.');
        }

        const membership = await tx.accountMember.findFirst({
          where: {
            accountId: account.id,
            userId: input.userId,
            status: 'ACTIVE',
          },
        });

        if (!membership || membership.role === 'VIEWER') {
          throw new ForbiddenException(
            'Você não possui permissão para pagar esta parcela.',
          );
        }

        const category = await tx.category.findFirst({
          where: {
            id: plan.categoryId,
            tenantId: input.tenantId,
            deletedAt: null,
            type: 'EXPENSE',
          },
        });

        if (!category) {
          throw new BadRequestException(
            'Categoria de despesa inválida.',
          );
        }

        if (plan.subCategoryId) {
          const subCategory = await tx.subCategory.findFirst({
            where: {
              id: plan.subCategoryId,
              categoryId: category.id,
              deletedAt: null,
            },
          });

          if (!subCategory) {
            throw new BadRequestException(
              'Subcategoria inválida.',
            );
          }
        }

        const amount = new Prisma.Decimal(installment.amount);

        if (!amount.isFinite() || amount.lte(0)) {
          throw new BadRequestException(
            'Valor da parcela inválido.',
          );
        }

        const reserved = await tx.installment.updateMany({
          where: {
            id: installment.id,
            tenantId: input.tenantId,
            installmentPlanId: plan.id,
            status: InstallmentStatus.PENDING,
            transactionId: null,
          },
          data: {
            status: InstallmentStatus.PAID,
            paidAt,
          },
        });

        if (reserved.count !== 1) {
          throw new ConflictException(
            'Esta parcela já está sendo paga.',
          );
        }

        const transaction = await tx.transaction.create({
          data: {
            tenantId: input.tenantId,
            userId: input.userId,
            accountId: account.id,
            categoryId: category.id,
            subCategoryId: plan.subCategoryId,
            title: `${plan.title} - Parcela ${installment.installmentNumber}/${plan.installmentCount}`,
            amount,
            type: TransactionType.EXPENSE,
            date: paidAt,
            description: plan.description,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            tenantId: input.tenantId,
            userId: input.userId,
            accountId: account.id,
            type: LedgerEntryType.DEBIT,
            amount,
            description: `Pagamento da parcela ${installment.installmentNumber}/${plan.installmentCount}`,
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
            'Não foi possível atualizar o saldo.',
          );
        }

        const linked = await tx.installment.updateMany({
          where: {
            id: installment.id,
            tenantId: input.tenantId,
            status: InstallmentStatus.PAID,
            transactionId: null,
          },
          data: {
            transactionId: transaction.id,
          },
        });

        if (linked.count !== 1) {
          throw new ConflictException(
            'Não foi possível vincular o pagamento à parcela.',
          );
        }

        return {
          installmentId: installment.id,
          installmentPlanId: plan.id,
          transactionId: transaction.id,
          installmentNumber: installment.installmentNumber,
          status: InstallmentStatus.PAID,
          amount: amount.toString(),
          paidAt,
        };
      },
      'Conflito ao pagar a parcela. Tente novamente.',
    );
  }
}
