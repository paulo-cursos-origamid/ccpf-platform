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
  FinancialObligationSourceType as PrismaFinancialObligationSourceType,
  FinancialObligationType as PrismaFinancialObligationType,
  LedgerEntryType,
  LedgerReferenceType,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { FinancialObligationEntity } from '../../domain/entities/financial-obligation.entity';
import { FinancialObligationSettlementEntity } from '../../domain/entities/financial-obligation-settlement.entity';
import {
  FinancialObligationRepository,
  SettleFinancialObligationOptions,
} from '../../domain/repositories/financial-obligation.repository';
import { FinancialObligationStatus } from '../../domain/enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../../domain/enums/financial-obligation-type.enum';
import { FinancialObligationSourceType } from '../../domain/enums/financial-obligation-source-type.enum';

@Injectable()
export class PrismaFinancialObligationRepository implements FinancialObligationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    obligation: FinancialObligationEntity,
  ): Promise<FinancialObligationEntity> {
    if (obligation.sourceType !== FinancialObligationSourceType.MANUAL) {
      throw new BadRequestException(
        'Compromissos com origem automática devem usar createOrFindBySource.',
      );
    }

    const created = await this.prisma.financialObligation.create({
      data: this.toCreateData(obligation),
    });

    return this.toDomain(created);
  }

  async createOrFindBySource(
    obligation: FinancialObligationEntity,
  ): Promise<FinancialObligationEntity> {
    const sourceId = obligation.sourceId;

    if (
      obligation.sourceType === FinancialObligationSourceType.MANUAL ||
      !sourceId
    ) {
      throw new BadRequestException(
        'A criação idempotente exige uma origem automática identificada.',
      );
    }

    const where = {
      tenantId: obligation.tenantId,
      sourceType: obligation.sourceType as PrismaFinancialObligationSourceType,
      sourceId,
    };

    const existing = await this.prisma.financialObligation.findFirst({
      where,
      include: { settlements: true },
    });

    if (existing) {
      return this.toDomain(existing);
    }

    try {
      const created = await this.prisma.financialObligation.create({
        data: this.toCreateData(obligation),
        include: { settlements: true },
      });

      return this.toDomain(created);
    } catch (error) {
      if (!this.isSourceUniqueConflict(error)) {
        throw error;
      }

      // Outra requisição pode ter criado a mesma origem simultaneamente.
      const concurrent = await this.prisma.financialObligation.findFirst({
        where,
        include: { settlements: true },
      });

      if (concurrent) {
        return this.toDomain(concurrent);
      }

      throw error;
    }
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
        OR: [
          {
            account: {
              accountMembers: {
                some: { userId, status: 'ACTIVE' },
              },
            },
          },
          {
            sourceType: PrismaFinancialObligationSourceType.CREDIT_CARD_INVOICE,
            tenant: {
              members: {
                some: { userId, status: 'ACTIVE' },
              },
            },
          },
        ],
      },
      include: { settlements: true },
    });

    return obligation ? this.toDomain(obligation) : null;
  }
  async findBySource(
    tenantId: string,
    userId: string,
    sourceType: FinancialObligationSourceType,
    sourceId: string,
  ): Promise<FinancialObligationEntity | null> {
    const accessFilter =
      sourceType === FinancialObligationSourceType.CREDIT_CARD_INVOICE
        ? {
            tenant: {
              members: {
                some: { userId, status: 'ACTIVE' as const },
              },
            },
          }
        : {
            account: {
              accountMembers: {
                some: { userId, status: 'ACTIVE' as const },
              },
            },
          };

    const obligation = await this.prisma.financialObligation.findFirst({
      where: {
        tenantId,
        sourceType: sourceType as PrismaFinancialObligationSourceType,
        sourceId,
        ...accessFilter,
      },
      include: { settlements: true },
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
        OR: [
          {
            account: {
              accountMembers: {
                some: { userId, status: 'ACTIVE' },
              },
            },
          },
          {
            sourceType: PrismaFinancialObligationSourceType.CREDIT_CARD_INVOICE,
            tenant: {
              members: {
                some: { userId, status: 'ACTIVE' },
              },
            },
          },
        ],
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      include: { settlements: true },
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
    const settlement = options.settlement;

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const current = await tx.financialObligation.findFirst({
            where: {
              id: obligation.id,
              tenantId: obligation.tenantId,
              status: {
                in: [
                  PrismaFinancialObligationStatus.PENDING,
                  PrismaFinancialObligationStatus.PARTIALLY_SETTLED,
                ],
              },
            },
            include: { settlements: true },
          });

          if (!current) {
            throw new ConflictException(
              'Este compromisso não está mais disponível para liquidação.',
            );
          }

          const currentObligation = this.toDomain(current);

          try {
            currentObligation.registerSettlement(settlement);
          } catch (error) {
            throw new BadRequestException(
              error instanceof Error ? error.message : 'Liquidação inválida.',
            );
          }

          const isCardInvoice = current.sourceType === 'CREDIT_CARD_INVOICE';
          if (!isCardInvoice && !current.categoryId) {
            throw new ConflictException(
              'A categoria da obrigação não está disponível para liquidação.',
            );
          }


          if (!isCardInvoice && settlement.accountId !== current.accountId) {
            throw new BadRequestException(
              'A conta utilizada deve ser a conta de referência do compromisso.',
            );
          }

          if (
            isCardInvoice &&
            current.type !== PrismaFinancialObligationType.PAYABLE
          ) {
            throw new BadRequestException(
              'Uma fatura de cartão deve ser um compromisso a pagar.',
            );
          }

          const account = await tx.account.findFirst({
            where: {
              id: settlement.accountId,
              tenantId: current.tenantId,
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
              userId: settlement.userId,
              status: 'ACTIVE',
            },
          });

          if (!membership || membership.role === 'VIEWER') {
            throw new ForbiddenException(
              'Você não tem permissão para liquidar este compromisso.',
            );
          }

          if (!isCardInvoice) {
            const expectedCategoryType =
              current.type === PrismaFinancialObligationType.PAYABLE
                ? CategoryType.EXPENSE
                : CategoryType.INCOME;

            const category = await tx.category.findFirst({
              where: {
                id: current.categoryId!,
                tenantId: current.tenantId,
                deletedAt: null,
                type: expectedCategoryType,
              },
            });

            if (!category) {
              throw new BadRequestException(
                'A categoria não corresponde ao compromisso.',
              );
            }

            if (current.subCategoryId) {
              const subCategory = await tx.subCategory.findFirst({
                where: {
                  id: current.subCategoryId,
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
          }

          const cashAmount = new Prisma.Decimal(settlement.settledAmount);
          const hasCashMovement = cashAmount.greaterThan(0);

          if (isCardInvoice && settlement.transactionId) {
            throw new BadRequestException(
              'O pagamento de fatura de cartão não pode ser vinculado a uma transação.',
            );
          }

          if (settlement.transactionId && !hasCashMovement) {
            throw new BadRequestException(
              'Uma liquidação sem movimentação financeira não pode vincular uma transação.',
            );
          }

          if (isCardInvoice) {
            if (hasCashMovement) {
              const description =
                options.description?.trim() ||
                current.description ||
                current.title;

              await tx.ledgerEntry.create({
                data: {
                  tenantId: current.tenantId,
                  userId: settlement.userId,
                  accountId: account.id,
                  type: LedgerEntryType.DEBIT,
                  amount: cashAmount,
                  description,
                  referenceId: settlement.id,
                  referenceType:
                    LedgerReferenceType.CREDIT_CARD_INVOICE_PAYMENT,
                },
              });

              const updatedAccount = await tx.account.updateMany({
                where: {
                  id: account.id,
                  tenantId: current.tenantId,
                  archivedAt: null,
                },
                data: {
                  balance: { decrement: cashAmount },
                },
              });

              if (updatedAccount.count !== 1) {
                throw new ConflictException(
                  'Não foi possível atualizar o saldo da conta.',
                );
              }
            }
          } else {
            const transactionType =
              current.type === PrismaFinancialObligationType.PAYABLE
                ? TransactionType.EXPENSE
                : TransactionType.INCOME;

            let transactionId: string | null = null;

            if (hasCashMovement && settlement.transactionId) {
              const existing = await tx.transaction.findFirst({
                where: {
                  id: settlement.transactionId,
                  tenantId: current.tenantId,
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
                existing.categoryId !== current.categoryId ||
                existing.subCategoryId !== current.subCategoryId ||
                existing.type !== transactionType ||
                !new Prisma.Decimal(existing.amount).equals(cashAmount)
              ) {
                throw new BadRequestException(
                  'A transação não corresponde ao valor e à classificação desta liquidação.',
                );
              }

              transactionId = existing.id;
            }

            if (hasCashMovement && !transactionId) {
              const description =
                options.description?.trim() ||
                current.description ||
                current.title;

              const transaction = await tx.transaction.create({
                data: {
                  tenantId: current.tenantId,
                  userId: settlement.userId,
                  accountId: account.id,
                  categoryId: current.categoryId!,
                  subCategoryId: current.subCategoryId,
                  title: current.title,
                  amount: cashAmount,
                  type: transactionType,
                  date: settlement.settledAt,
                  description,
                },
              });

              transactionId = transaction.id;
              settlement.linkTransaction(transaction.id);

              await tx.ledgerEntry.create({
                data: {
                  tenantId: current.tenantId,
                  userId: settlement.userId,
                  accountId: account.id,
                  type:
                    transactionType === TransactionType.INCOME
                      ? LedgerEntryType.CREDIT
                      : LedgerEntryType.DEBIT,
                  amount: cashAmount,
                  description,
                  referenceId: transaction.id,
                  referenceType: LedgerReferenceType.TRANSACTION,
                },
              });

              const updatedAccount = await tx.account.updateMany({
                where: {
                  id: account.id,
                  tenantId: current.tenantId,
                  archivedAt: null,
                },
                data:
                  transactionType === TransactionType.INCOME
                    ? { balance: { increment: cashAmount } }
                    : { balance: { decrement: cashAmount } },
              });

              if (updatedAccount.count !== 1) {
                throw new ConflictException(
                  'Não foi possível atualizar o saldo da conta.',
                );
              }
            }
          }

          const persistedSettlement =
            await tx.financialObligationSettlement.create({
              data: {
                id: settlement.id,
                obligationId: settlement.obligationId,
                tenantId: settlement.tenantId,
                userId: settlement.userId,
                accountId: settlement.accountId,
                transactionId: settlement.transactionId,
                principalAmount: new Prisma.Decimal(settlement.principalAmount),
                interestAmount: new Prisma.Decimal(settlement.interestAmount),
                feeAmount: new Prisma.Decimal(settlement.feeAmount),
                discountAmount: new Prisma.Decimal(settlement.discountAmount),
                settledAmount: cashAmount,
                settledAt: settlement.settledAt,
                createdAt: settlement.createdAt,
              },
            });

          const updated = await tx.financialObligation.updateMany({
            where: {
              id: current.id,
              tenantId: current.tenantId,
              status: current.status,
              transactionId: current.transactionId,
              updatedAt: current.updatedAt,
            },
            data: {
              status: currentObligation.status,
              settledAt: currentObligation.settledAt,
            },
          });

          if (updated.count !== 1) {
            throw new ConflictException(
              'O compromisso foi alterado durante a liquidação. Tente novamente.',
            );
          }

          if (
            isCardInvoice &&
            currentObligation.status === PrismaFinancialObligationStatus.SETTLED
          ) {
            if (!current.sourceId) {
              throw new ConflictException(
                'A obrigação não possui uma fatura de cartão associada.',
              );
            }

            const updatedInvoice = await tx.creditCardInvoice.updateMany({
              where: {
                id: current.sourceId,
                tenantId: current.tenantId,
                status: { in: ['OPEN', 'CLOSED'] },
              },
              data: { status: 'PAID' },
            });

            if (updatedInvoice.count !== 1) {
              throw new ConflictException(
                'A fatura associada não foi encontrada ou não pode ser marcada como paga.',
              );
            }
          }

          return new FinancialObligationEntity({
            ...this.toProps(currentObligation),
            transactionId: current.transactionId,
            settlements: [
              ...currentObligation.settlements.filter(
                (item) => item.id !== persistedSettlement.id,
              ),
              settlement,
            ],
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

  private toCreateData(obligation: FinancialObligationEntity) {
    return {
      id: obligation.id,
      tenantId: obligation.tenantId,
      userId: obligation.userId,
      accountId: obligation.accountId,
      categoryId: obligation.categoryId,
      subCategoryId: obligation.subCategoryId,
      sourceType: obligation.sourceType as PrismaFinancialObligationSourceType,
      sourceId: obligation.sourceId,
      type: obligation.type,
      status: obligation.status,
      title: obligation.title,
      counterparty: obligation.counterparty,
      amount: new Prisma.Decimal(obligation.amount),
      dueDate: obligation.dueDate,
      description: obligation.description,
    };
  }

  private isSourceUniqueConflict(error: unknown): boolean {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return false;
    }

    const target = error.meta?.target;

    if (Array.isArray(target)) {
      return ['tenantId', 'sourceType', 'sourceId'].every((field) =>
        target.includes(field),
      );
    }

    return (
      typeof target === 'string' &&
      target.includes('FinancialObligation_tenantId_sourceType_sourceId_key')
    );
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
      sourceType: obligation.sourceType,
      sourceId: obligation.sourceId,
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

  private toDomain(raw: any): FinancialObligationEntity {
    const settlements = (raw.settlements ?? []).map(
      (item: any) =>
        new FinancialObligationSettlementEntity({
          id: item.id,
          obligationId: item.obligationId,
          tenantId: item.tenantId,
          userId: item.userId,
          accountId: item.accountId,
          principalAmount: item.principalAmount.toFixed(2),
          interestAmount: item.interestAmount.toFixed(2),
          feeAmount: item.feeAmount.toFixed(2),
          discountAmount: item.discountAmount.toFixed(2),
          settledAt: item.settledAt,
          transactionId: item.transactionId,
          createdAt: item.createdAt,
        }),
    );

    return new FinancialObligationEntity({
      id: raw.id,
      tenantId: raw.tenantId,
      userId: raw.userId,
      accountId: raw.accountId,
      categoryId: raw.categoryId,
      subCategoryId: raw.subCategoryId,
      transactionId: raw.transactionId,
      sourceType: raw.sourceType as FinancialObligationSourceType,
      sourceId: raw.sourceId,
      type: raw.type as FinancialObligationType,
      status: raw.status as FinancialObligationStatus,
      title: raw.title,
      counterparty: raw.counterparty,
      amount: raw.amount.toFixed(2),
      dueDate: raw.dueDate,
      settledAt: raw.settledAt,
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      settlements,
    });
  }
}
