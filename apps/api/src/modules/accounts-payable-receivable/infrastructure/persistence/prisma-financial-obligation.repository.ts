import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryType,
  FinancialObligationStatus as PrismaFinancialObligationStatus,
  FinancialObligationType as PrismaFinancialObligationType,
  LedgerEntryType,
  LedgerReferenceType,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { FinancialObligationEntity } from '../../domain/entities/financial-obligation.entity';
import {
  FinancialObligationRepository,
  SettleFinancialObligationOptions,
} from '../../domain/repositories/financial-obligation.repository';
import { FinancialObligationStatus } from '../../domain/enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../../domain/enums/financial-obligation-type.enum';

@Injectable()
export class PrismaFinancialObligationRepository implements FinancialObligationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    obligation: FinancialObligationEntity,
  ): Promise<FinancialObligationEntity> {
    const created = await this.prisma.financialObligation.create({
      data: {
        id: obligation.id,
        tenantId: obligation.tenantId,
        userId: obligation.userId,
        accountId: obligation.accountId,
        categoryId: obligation.categoryId,
        subCategoryId: obligation.subCategoryId,
        type: obligation.type,
        status: obligation.status,
        title: obligation.title,
        counterparty: obligation.counterparty,
        amount: new Prisma.Decimal(obligation.amount),
        dueDate: obligation.dueDate,
        description: obligation.description,
      },
    });
    return this.toDomain(created);
  }

  async findById(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<FinancialObligationEntity | null> {
    const obligation = await this.prisma.financialObligation.findFirst({
      where: {
        id,
        tenantId,
        account: {
          accountMembers: { some: { userId, status: 'ACTIVE' } },
        },
      },
    });
    return obligation ? this.toDomain(obligation) : null;
  }

  async findMany(
    tenantId: string,
    userId: string,
    filters: {
      type?: FinancialObligationType;
      status?: FinancialObligationStatus;
    },
  ): Promise<FinancialObligationEntity[]> {
    const obligations = await this.prisma.financialObligation.findMany({
      where: {
        tenantId,
        account: {
          accountMembers: { some: { userId, status: 'ACTIVE' } },
        },
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
    return obligations.map((obligation) => this.toDomain(obligation));
  }

  async update(
    obligation: FinancialObligationEntity,
  ): Promise<FinancialObligationEntity> {
    const updated = await this.prisma.financialObligation.updateMany({
      where: {
        id: obligation.id,
        tenantId: obligation.tenantId,
        status: FinancialObligationStatus.PENDING,
      },
      data: this.toUpdateData(obligation),
    });
    if (updated.count !== 1) {
      throw new ConflictException('O compromisso não está mais pendente.');
    }
    const persisted = await this.prisma.financialObligation.findFirst({
      where: { id: obligation.id, tenantId: obligation.tenantId },
    });
    if (!persisted) {
      throw new NotFoundException('Compromisso não encontrado neste Espaço.');
    }
    return this.toDomain(persisted);
  }

  async cancel(obligation: FinancialObligationEntity): Promise<void> {
    const canceled = await this.prisma.financialObligation.updateMany({
      where: {
        id: obligation.id,
        tenantId: obligation.tenantId,
        status: FinancialObligationStatus.PENDING,
        transactionId: null,
      },
      data: { status: FinancialObligationStatus.CANCELED },
    });
    if (canceled.count !== 1) {
      throw new ConflictException('O compromisso não está mais pendente.');
    }
  }

  async settle(
    obligation: FinancialObligationEntity,
    options: SettleFinancialObligationOptions,
  ): Promise<FinancialObligationEntity> {
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const current = await tx.financialObligation.findFirst({
            where: {
              id: obligation.id,
              tenantId: obligation.tenantId,
              status: PrismaFinancialObligationStatus.PENDING,
              transactionId: null,
            },
          });
          if (!current) {
            throw new ConflictException(
              'Este compromisso já foi liquidado ou cancelado.',
            );
          }

          const account = await tx.account.findFirst({
            where: {
              id: obligation.accountId,
              tenantId: obligation.tenantId,
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
              userId: options.userId,
              status: 'ACTIVE',
            },
          });
          if (!membership || membership.role === 'VIEWER') {
            throw new ForbiddenException(
              'Você não tem permissão para liquidar este compromisso.',
            );
          }

          const expectedCategoryType =
            obligation.type === FinancialObligationType.PAYABLE
              ? CategoryType.EXPENSE
              : CategoryType.INCOME;
          const category = await tx.category.findFirst({
            where: {
              id: obligation.categoryId,
              tenantId: obligation.tenantId,
              deletedAt: null,
              type: expectedCategoryType,
            },
          });
          if (!category) {
            throw new BadRequestException(
              'A categoria não corresponde ao compromisso.',
            );
          }
          if (obligation.subCategoryId) {
            const subCategory = await tx.subCategory.findFirst({
              where: {
                id: obligation.subCategoryId,
                categoryId: category.id,
                deletedAt: null,
              },
            });
            if (!subCategory) {
              throw new BadRequestException(
                'A subcategoria não está disponível.',
              );
            }
          }

          const amount = new Prisma.Decimal(obligation.amount);
          const transactionType =
            obligation.type === FinancialObligationType.PAYABLE
              ? TransactionType.EXPENSE
              : TransactionType.INCOME;
          if (options.transactionId) {
            const existing = await tx.transaction.findFirst({
              where: {
                id: options.transactionId,
                tenantId: obligation.tenantId,
                deletedAt: null,
              },
            });
            if (!existing) {
              throw new NotFoundException(
                'Transação não encontrada neste Espaço.',
              );
            }
            if (
              existing.accountId !== account.id ||
              existing.categoryId !== category.id ||
              existing.subCategoryId !== obligation.subCategoryId ||
              existing.type !== transactionType ||
              !new Prisma.Decimal(existing.amount).equals(amount)
            ) {
              throw new BadRequestException(
                'A transação não corresponde ao valor e à classificação do compromisso.',
              );
            }
          }

          const reserved = await tx.financialObligation.updateMany({
            where: {
              id: obligation.id,
              tenantId: obligation.tenantId,
              status: PrismaFinancialObligationStatus.PENDING,
              transactionId: null,
            },
            data: {
              status: PrismaFinancialObligationStatus.SETTLED,
              settledAt: options.settledAt,
              ...(options.transactionId
                ? { transactionId: options.transactionId }
                : {}),
            },
          });
          if (reserved.count !== 1) {
            throw new ConflictException(
              'Este compromisso já está sendo liquidado.',
            );
          }

          if (options.transactionId) {
            return new FinancialObligationEntity({
              ...this.toProps(obligation),
              status: FinancialObligationStatus.SETTLED,
              transactionId: options.transactionId,
              settledAt: options.settledAt,
            });
          }

          const description =
            options.description?.trim() ||
            obligation.description ||
            obligation.title;
          const transaction = await tx.transaction.create({
            data: {
              tenantId: obligation.tenantId,
              userId: options.userId,
              accountId: account.id,
              categoryId: category.id,
              subCategoryId: obligation.subCategoryId,
              title: obligation.title,
              amount,
              type: transactionType,
              date: options.settledAt,
              description,
            },
          });

          await tx.ledgerEntry.create({
            data: {
              tenantId: obligation.tenantId,
              userId: options.userId,
              accountId: account.id,
              type:
                transactionType === TransactionType.INCOME
                  ? LedgerEntryType.CREDIT
                  : LedgerEntryType.DEBIT,
              amount,
              description,
              referenceId: transaction.id,
              referenceType: LedgerReferenceType.TRANSACTION,
            },
          });

          const updatedAccount = await tx.account.updateMany({
            where: {
              id: account.id,
              tenantId: obligation.tenantId,
              archivedAt: null,
            },
            data:
              transactionType === TransactionType.INCOME
                ? { balance: { increment: amount } }
                : { balance: { decrement: amount } },
          });
          if (updatedAccount.count !== 1) {
            throw new ConflictException(
              'Não foi possível atualizar o saldo da conta.',
            );
          }

          const linked = await tx.financialObligation.updateMany({
            where: {
              id: obligation.id,
              tenantId: obligation.tenantId,
              status: PrismaFinancialObligationStatus.SETTLED,
              transactionId: null,
            },
            data: { transactionId: transaction.id },
          });
          if (linked.count !== 1) {
            throw new ConflictException(
              'Não foi possível vincular a transação ao compromisso.',
            );
          }

          return new FinancialObligationEntity({
            ...this.toProps(obligation),
            status: FinancialObligationStatus.SETTLED,
            transactionId: transaction.id,
            settledAt: options.settledAt,
            description,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Conflito ao liquidar o compromisso. Tente novamente.',
        );
      }
      throw error;
    }
  }

  private toUpdateData(obligation: FinancialObligationEntity) {
    return {
      accountId: obligation.accountId,
      categoryId: obligation.categoryId,
      subCategoryId: obligation.subCategoryId,
      type: obligation.type,
      title: obligation.title,
      counterparty: obligation.counterparty,
      amount: new Prisma.Decimal(obligation.amount),
      dueDate: obligation.dueDate,
      description: obligation.description,
    };
  }

  private toProps(obligation: FinancialObligationEntity) {
    return {
      id: obligation.id,
      tenantId: obligation.tenantId,
      userId: obligation.userId,
      accountId: obligation.accountId,
      categoryId: obligation.categoryId,
      subCategoryId: obligation.subCategoryId,
      transactionId: obligation.transactionId,
      type: obligation.type,
      status: obligation.status,
      title: obligation.title,
      counterparty: obligation.counterparty,
      amount: obligation.amount,
      dueDate: obligation.dueDate,
      settledAt: obligation.settledAt,
      description: obligation.description,
      createdAt: obligation.createdAt,
      updatedAt: obligation.updatedAt,
    };
  }

  private toDomain(raw: {
    id: string;
    tenantId: string;
    userId: string;
    accountId: string;
    categoryId: string;
    subCategoryId: string | null;
    transactionId: string | null;
    type: PrismaFinancialObligationType;
    status: PrismaFinancialObligationStatus;
    title: string;
    counterparty: string | null;
    amount: Prisma.Decimal;
    dueDate: Date;
    settledAt: Date | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): FinancialObligationEntity {
    return new FinancialObligationEntity({
      ...raw,
      type: raw.type as FinancialObligationType,
      status: raw.status as FinancialObligationStatus,
      amount: raw.amount.toFixed(2),
    });
  }
}
