import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../../../infrastructure/database/prisma.service";
import { FinancialObligationEntity } from "../../../accounts-payable-receivable/domain/entities/financial-obligation.entity";
import { FinancialObligationStatus } from "../../../accounts-payable-receivable/domain/enums/financial-obligation-status.enum";
import { FinancialObligationSourceType } from "../../../accounts-payable-receivable/domain/enums/financial-obligation-source-type.enum";
import { FinancialObligationType } from "../../../accounts-payable-receivable/domain/enums/financial-obligation-type.enum";
import { FinancialPaymentMethod } from "../../../accounts-payable-receivable/domain/enums/financial-payment-method.enum";
import { FinancialObligationRepository } from "../../../accounts-payable-receivable/domain/repositories/financial-obligation.repository";
import { SettleFinancialObligationUseCase } from "../../../accounts-payable-receivable/application/use-cases/settle-financial-obligation/settle-financial-obligation.use-case";

export interface PayInstallmentInput {
  tenantId: string;
  userId: string;
  installmentPlanId: string;
  installmentId: string;
  paidAt: string;
  accountId?: string;
  paymentMethod?: FinancialPaymentMethod;
  principalAmount?: string;
  interestAmount?: string;
  feeAmount?: string;
  discountAmount?: string;
  description?: string;
}

@Injectable()
export class PayInstallmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly obligations: FinancialObligationRepository,
    private readonly settleObligation: SettleFinancialObligationUseCase,
  ) {}

  async execute(input: PayInstallmentInput) {
    const paidAt = new Date(input.paidAt);

    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException("Data de pagamento inválida.");
    }

    const installment = await this.prisma.installment.findFirst({
      where: {
        id: input.installmentId,
        tenantId: input.tenantId,
        installmentPlanId: input.installmentPlanId,
      },
      include: { plan: true },
    });

    if (!installment || installment.plan.deletedAt) {
      throw new NotFoundException("Parcela não encontrada.");
    }

    const plan = installment.plan;
    const sourceType = FinancialObligationSourceType.INSTALLMENT;

    let obligation = await this.obligations.findBySource(
      input.tenantId,
      input.userId,
      sourceType,
      installment.id,
    );

    if (installment.status === "PAID") {
      if (obligation?.status === FinancialObligationStatus.SETTLED) {
        return this.toResult(installment, obligation, paidAt);
      }

      throw new ConflictException(
        "Esta parcela não está disponível para pagamento.",
      );
    }

    if (installment.status !== "PENDING" || installment.transactionId) {
      throw new ConflictException(
        "Esta parcela não está disponível para pagamento.",
      );
    }

    if (!obligation) {
      const amount = new Prisma.Decimal(installment.amount);

      if (!amount.isFinite() || amount.lte(0)) {
        throw new BadRequestException("Valor da parcela inválido.");
      }

      obligation = await this.obligations.createOrFindBySource(
        new FinancialObligationEntity({
          tenantId: input.tenantId,
          userId: input.userId,
          accountId: plan.accountId,
          categoryId: plan.categoryId,
          subCategoryId: plan.subCategoryId,
          type: FinancialObligationType.PAYABLE,
          title: `${plan.title} - Parcela ${installment.installmentNumber}/${plan.installmentCount}`,
          amount: amount.toFixed(2),
          dueDate: installment.dueDate,
          description: plan.description,
          sourceType,
          sourceId: installment.id,
        }),
      );
    }

    if (obligation.status === FinancialObligationStatus.SETTLED) {
      return this.markInstallmentPaid(input, installment, obligation, paidAt);
    }

    if (
      obligation.status !== FinancialObligationStatus.PENDING &&
      obligation.status !== FinancialObligationStatus.PARTIALLY_SETTLED
    ) {
      throw new ConflictException(
        "A obrigação desta parcela não está disponível para liquidação.",
      );
    }

    let settled: FinancialObligationEntity;

    try {
      settled = await this.settleObligation.execute({
        id: obligation.id,
        tenantId: input.tenantId,
        userId: input.userId,
        settledAt: paidAt,
        accountId: input.accountId,
        paymentMethod: input.paymentMethod,
        principalAmount: input.principalAmount ?? obligation.remainingAmount,
        interestAmount: input.interestAmount ?? "0.00",
        feeAmount: input.feeAmount ?? "0.00",
        discountAmount: input.discountAmount ?? "0.00",
        description: input.description?.trim() || plan.description?.trim() || undefined,
      });
    } catch (error) {
      // Recupera uma liquidação parcial ou total feita por outra requisição.
      const latest = await this.obligations.findBySource(
        input.tenantId,
        input.userId,
        sourceType,
        installment.id,
      );

      if (latest?.status === FinancialObligationStatus.SETTLED) {
        return this.markInstallmentPaid(input, installment, latest, paidAt);
      }

      if (
        latest?.status === FinancialObligationStatus.PARTIALLY_SETTLED &&
        latest.settlements.length > obligation.settlements.length
      ) {
        return this.toResult(installment, latest, paidAt);
      }

      throw error;
    }

    if (settled.status === FinancialObligationStatus.SETTLED) {
      return this.markInstallmentPaid(input, installment, settled, paidAt);
    }

    if (settled.status === FinancialObligationStatus.PARTIALLY_SETTLED) {
      return this.toResult(installment, settled, paidAt);
    }

    throw new ConflictException(
      "A liquidação não produziu um estado válido para a obrigação desta parcela.",
    );
  }

  private async markInstallmentPaid(
    input: PayInstallmentInput,
    installment: any,
    obligation: FinancialObligationEntity,
    fallbackPaidAt: Date,
  ) {
    const result = this.toResult(installment, obligation, fallbackPaidAt);

    const updated = await this.prisma.installment.updateMany({
      where: {
        id: installment.id,
        tenantId: input.tenantId,
        installmentPlanId: input.installmentPlanId,
        status: "PENDING",
        transactionId: null,
      },
      data: {
        status: "PAID",
        paidAt: result.paidAt,
        transactionId: result.transactionId,
      },
    });

    if (updated.count === 1) {
      return result;
    }

    // Outra requisição pode ter sincronizado a parcela simultaneamente.
    const current = await this.prisma.installment.findFirst({
      where: {
        id: input.installmentId,
        tenantId: input.tenantId,
        installmentPlanId: input.installmentPlanId,
      },
      include: { plan: true },
    });

    if (
      current?.status === "PAID" &&
      current.transactionId === result.transactionId
    ) {
      return this.toResult(current, obligation, fallbackPaidAt);
    }

    throw new ConflictException(
      "A liquidação foi registrada, mas a parcela precisa ser sincronizada. Tente novamente.",
    );
  }

  private toResult(
    installment: any,
    obligation: FinancialObligationEntity,
    fallbackPaidAt: Date,
  ) {
    const settlements = [...obligation.settlements].sort(
      (a, b) => a.settledAt.getTime() - b.settledAt.getTime(),
    );
    const lastSettlement = settlements[settlements.length - 1];
    const isSettled = obligation.status === FinancialObligationStatus.SETTLED;

    return {
      installmentId: installment.id,
      installmentPlanId: installment.installmentPlanId,
      transactionId:
        installment.transactionId ?? lastSettlement?.transactionId ?? null,
      installmentNumber: installment.installmentNumber,
      status: isSettled ? "PAID" : "PENDING",
      amount: new Prisma.Decimal(obligation.amount).toFixed(2),
      totalSettledAmount: new Prisma.Decimal(
        obligation.totalSettledAmount,
      ).toFixed(2),
      remainingAmount: new Prisma.Decimal(obligation.remainingAmount).toFixed(2),
      paidAt: isSettled
        ? installment.paidAt ??
          obligation.settledAt ??
          lastSettlement?.settledAt ??
          fallbackPaidAt
        : null,
    };
  }
}
