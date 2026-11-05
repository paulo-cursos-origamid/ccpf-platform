import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { FinancialObligationEntity } from '../../accounts-payable-receivable/domain/entities/financial-obligation.entity';
import { FinancialObligationStatus } from '../../accounts-payable-receivable/domain/enums/financial-obligation-status.enum';
import { FinancialObligationSourceType } from '../../accounts-payable-receivable/domain/enums/financial-obligation-source-type.enum';
import { FinancialObligationType } from '../../accounts-payable-receivable/domain/enums/financial-obligation-type.enum';
import { FinancialObligationRepository } from '../../accounts-payable-receivable/domain/repositories/financial-obligation.repository';
import { SettleFinancialObligationUseCase } from '../../accounts-payable-receivable/application/use-cases/settle-financial-obligation/settle-financial-obligation.use-case';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly obligations: FinancialObligationRepository,
    private readonly settleObligation: SettleFinancialObligationUseCase,
  ) {}

  async execute(input: PayRecurringBillInput) {
    if (!/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/.test(input.amount)) {
      throw new BadRequestException('Valor do pagamento inválido.');
    }

    const cashAmount = new Prisma.Decimal(input.amount);

    if (!cashAmount.isFinite() || cashAmount.lte(0)) {
      throw new BadRequestException(
        'O valor do pagamento deve ser maior que zero.',
      );
    }

    const paidAt = new Date(input.paidAt);

    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException('Data do pagamento inválida.');
    }

    const occurrence = await this.prisma.recurringBillOccurrence.findFirst({
      where: {
        id: input.occurrenceId,
        tenantId: input.tenantId,
        recurringBillId: input.recurringBillId,
      },
      include: { recurringBill: true },
    });

    if (!occurrence) {
      throw new NotFoundException(
        'Vencimento não encontrado neste Espaço.',
      );
    }

    const bill = occurrence.recurringBill;
    const sourceType = FinancialObligationSourceType.RECURRING_BILL_OCCURRENCE;

    if (occurrence.status === 'PAID') {
      const existing = await this.obligations.findBySource(
        input.tenantId,
        input.userId,
        sourceType,
        occurrence.id,
      );

      if (existing?.status === FinancialObligationStatus.SETTLED) {
        const settlements = [...existing.settlements].sort(
          (a, b) => a.settledAt.getTime() - b.settledAt.getTime(),
        );
        const lastSettlement = settlements[settlements.length - 1];

        return {
          occurrenceId: occurrence.id,
          recurringBillId: bill.id,
          transactionId:
            occurrence.transactionId ?? lastSettlement?.transactionId ?? null,
          status: 'PAID',
          paidAmount: new Prisma.Decimal(
            occurrence.paidAmount ?? existing.totalSettledAmount,
          ).toFixed(2),
          paidAt:
            occurrence.paidAt ??
            existing.settledAt ??
            lastSettlement?.settledAt ??
            paidAt,
        };
      }

      throw new ConflictException(
        'Este vencimento já foi pago ou cancelado.',
      );
    }

    if (occurrence.status !== 'PENDING' || occurrence.transactionId !== null) {
      throw new ConflictException(
        'Este vencimento já foi pago ou cancelado.',
      );
    }

    let obligation = await this.obligations.findBySource(
      input.tenantId,
      input.userId,
      sourceType,
      occurrence.id,
    );

    if (!obligation) {
      obligation = await this.obligations.createOrFindBySource(
        new FinancialObligationEntity({
          tenantId: bill.tenantId,
          userId: bill.userId,
          accountId: bill.accountId,
          categoryId: bill.categoryId,
          subCategoryId: bill.subCategoryId,
          type: FinancialObligationType.PAYABLE,
          title: bill.title,
          amount: occurrence.expectedAmount?.toString() ?? input.amount,
          dueDate: occurrence.dueDate,
          description: bill.description,
          sourceType,
          sourceId: occurrence.id,
        }),
      );
    }

    // Recupera uma liquidação concluída caso a sincronização da ocorrência
    // tenha falhado depois do commit financeiro.
    if (obligation.status === FinancialObligationStatus.SETTLED) {
      return this.markOccurrencePaid(input, obligation, paidAt);
    }

    if (
      obligation.status !== FinancialObligationStatus.PENDING &&
      obligation.status !== FinancialObligationStatus.PARTIALLY_SETTLED
    ) {
      throw new ConflictException(
        'A obrigação desta recorrência não está disponível para liquidação.',
      );
    }

    const principalAmount = new Prisma.Decimal(obligation.remainingAmount);

    if (principalAmount.lte(0)) {
      throw new ConflictException(
        'A obrigação não possui saldo disponível para liquidação.',
      );
    }

    // O endpoint recebe o valor efetivamente pago.
    // A diferença para o saldo principal é registrada como desconto ou juros.
    const discountAmount = cashAmount.lt(principalAmount)
      ? principalAmount.minus(cashAmount)
      : new Prisma.Decimal(0);

    const interestAmount = cashAmount.gt(principalAmount)
      ? cashAmount.minus(principalAmount)
      : new Prisma.Decimal(0);

    let settledObligation: FinancialObligationEntity;

    try {
      settledObligation = await this.settleObligation.execute({
        id: obligation.id,
        tenantId: input.tenantId,
        userId: input.userId,
        settledAt: paidAt,
        principalAmount: principalAmount.toFixed(2),
        interestAmount: interestAmount.toFixed(2),
        feeAmount: '0.00',
        discountAmount: discountAmount.toFixed(2),
        description:
          input.description?.trim() ||
          bill.description?.trim() ||
          bill.title,
      });
    } catch (error) {
      // Uma requisição concorrente pode ter concluído a mesma obrigação.
      const latest = await this.obligations.findBySource(
        input.tenantId,
        input.userId,
        sourceType,
        occurrence.id,
      );

      if (latest?.status === FinancialObligationStatus.SETTLED) {
        return this.markOccurrencePaid(input, latest, paidAt);
      }

      throw error;
    }

    if (settledObligation.status !== FinancialObligationStatus.SETTLED) {
      throw new ConflictException(
        'A liquidação não concluiu a obrigação recorrente.',
      );
    }

    return this.markOccurrencePaid(input, settledObligation, paidAt);
  }

  private async markOccurrencePaid(
    input: PayRecurringBillInput,
    obligation: FinancialObligationEntity,
    fallbackPaidAt: Date,
  ) {
    const settlements = [...obligation.settlements].sort(
      (a, b) => a.settledAt.getTime() - b.settledAt.getTime(),
    );
    const lastSettlement = settlements[settlements.length - 1];

    const paidAt =
      obligation.settledAt ??
      lastSettlement?.settledAt ??
      fallbackPaidAt;

    const transactionId = lastSettlement?.transactionId ?? null;
    const paidAmount = new Prisma.Decimal(obligation.totalSettledAmount);

    const updated = await this.prisma.recurringBillOccurrence.updateMany({
      where: {
        id: input.occurrenceId,
        tenantId: input.tenantId,
        recurringBillId: input.recurringBillId,
        status: 'PENDING',
        transactionId: null,
      },
      data: {
        status: 'PAID',
        paidAmount,
        paidAt,
        transactionId,
      },
    });

    if (updated.count === 1) {
      return {
        occurrenceId: input.occurrenceId,
        recurringBillId: input.recurringBillId,
        transactionId,
        status: 'PAID',
        paidAmount: paidAmount.toFixed(2),
        paidAt,
      };
    }

    // Outra requisição pode ter sincronizado a ocorrência simultaneamente.
    const current = await this.prisma.recurringBillOccurrence.findFirst({
      where: {
        id: input.occurrenceId,
        tenantId: input.tenantId,
        recurringBillId: input.recurringBillId,
      },
    });

    if (current?.status === 'PAID') {
      return {
        occurrenceId: current.id,
        recurringBillId: current.recurringBillId,
        transactionId: current.transactionId,
        status: current.status,
        paidAmount: current.paidAmount?.toString() ?? '0.00',
        paidAt: current.paidAt ?? paidAt,
      };
    }

    throw new ConflictException(
      'A liquidação foi registrada, mas o vencimento precisa ser sincronizado. Tente novamente.',
    );
  }
}
