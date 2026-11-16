import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { FinancialObligationEntity } from '../../../accounts-payable-receivable/domain/entities/financial-obligation.entity';
import { FinancialObligationSettlementEntity } from '../../../accounts-payable-receivable/domain/entities/financial-obligation-settlement.entity';
import { FinancialObligationStatus } from '../../../accounts-payable-receivable/domain/enums/financial-obligation-status.enum';
import { FinancialObligationSourceType } from '../../../accounts-payable-receivable/domain/enums/financial-obligation-source-type.enum';
import { FinancialObligationType } from '../../../accounts-payable-receivable/domain/enums/financial-obligation-type.enum';
import { FinancialPaymentMethod } from '../../../accounts-payable-receivable/domain/enums/financial-payment-method.enum';
import { FinancialObligationRepository } from '../../../accounts-payable-receivable/domain/repositories/financial-obligation.repository';
import { SettleFinancialObligationUseCase } from '../../../accounts-payable-receivable/application/use-cases/settle-financial-obligation/settle-financial-obligation.use-case';
import { PayInstallmentUseCase } from './pay-installment.use-case';

describe('PayInstallmentUseCase', () => {
  const paidAt = new Date('2026-10-25T12:00:00.000Z');
  const input = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    installmentPlanId: 'plan-1',
    installmentId: 'installment-1',
    paidAt: paidAt.toISOString(),
  };

  let prisma: any;
  let obligations: any;
  let settleObligation: any;
  let useCase: PayInstallmentUseCase;

  const createInstallment = (overrides: Record<string, unknown> = {}) => ({
    id: input.installmentId,
    tenantId: input.tenantId,
    installmentPlanId: input.installmentPlanId,
    status: 'PENDING',
    transactionId: null,
    paidAt: null,
    installmentNumber: 1,
    amount: new Prisma.Decimal('100.00'),
    dueDate: paidAt,
    plan: {
      id: input.installmentPlanId,
      tenantId: input.tenantId,
      userId: input.userId,
      accountId: 'account-1',
      categoryId: 'category-1',
      subCategoryId: null,
      title: 'Compra parcelada',
      description: 'Compra realizada',
      installmentCount: 3,
      deletedAt: null,
    },
    ...overrides,
  });

  const createObligation = () =>
    new FinancialObligationEntity({
      id: 'obligation-1',
      tenantId: input.tenantId,
      userId: input.userId,
      accountId: 'account-1',
      categoryId: 'category-1',
      type: FinancialObligationType.PAYABLE,
      title: 'Compra parcelada - Parcela 1/3',
      amount: '100.00',
      dueDate: paidAt,
      sourceType: FinancialObligationSourceType.INSTALLMENT,
      sourceId: input.installmentId,
    });

  const createSettledObligation = () => {
    const base = createObligation();
    const settlement = new FinancialObligationSettlementEntity({
      obligationId: base.id,
      tenantId: base.tenantId,
      userId: input.userId,
      accountId: base.accountId ?? 'account-1',
      principalAmount: '100.00',
      interestAmount: '0.00',
      feeAmount: '0.00',
      discountAmount: '0.00',
      transactionId: 'transaction-1',
      settledAt: paidAt,
    });

    return new FinancialObligationEntity({
      ...base.toJSON(),
      status: FinancialObligationStatus.SETTLED,
      settledAt: paidAt,
      settlements: [settlement],
    });
  };

  const createPartiallySettledObligation = () => {
    const base = createObligation();
    const settlement = new FinancialObligationSettlementEntity({
      obligationId: base.id,
      tenantId: base.tenantId,
      userId: input.userId,
      accountId: "account-2",
      principalAmount: "40.00",
      interestAmount: "2.00",
      feeAmount: "0.00",
      discountAmount: "5.00",
      transactionId: null,
      paymentMethod: FinancialPaymentMethod.PIX,
      settledAt: paidAt,
    });

    base.registerSettlement(settlement);
    return base;
  };

  const createFullySettledAfterPartialObligation = () => {
    const base = createPartiallySettledObligation();
    const settlement = new FinancialObligationSettlementEntity({
      obligationId: base.id,
      tenantId: base.tenantId,
      userId: input.userId,
      accountId: "account-2",
      principalAmount: "60.00",
      interestAmount: "0.00",
      feeAmount: "0.00",
      discountAmount: "0.00",
      transactionId: "transaction-2",
      paymentMethod: FinancialPaymentMethod.CASH,
      settledAt: new Date(paidAt.getTime() + 86400000),
    });

    base.registerSettlement(settlement);
    return base;
  };

  beforeEach(() => {
    prisma = {
      installment: {
        findFirst: jest.fn().mockResolvedValue(createInstallment()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    obligations = {
      findBySource: jest.fn().mockResolvedValue(createObligation()),
      createOrFindBySource: jest.fn().mockImplementation(async (item) => item),
    };

    settleObligation = {
      execute: jest.fn().mockResolvedValue(createSettledObligation()),
    };

    useCase = new PayInstallmentUseCase(
      prisma as PrismaService,
      obligations as FinancialObligationRepository,
      settleObligation as SettleFinancialObligationUseCase,
    );
  });

  it('liquida a obrigação central e sincroniza a parcela', async () => {
    const result = await useCase.execute(input);

    expect(settleObligation.execute).toHaveBeenCalledWith({
      id: 'obligation-1',
      tenantId: input.tenantId,
      userId: input.userId,
      settledAt: paidAt,
      principalAmount: '100.00',
      interestAmount: '0.00',
      feeAmount: '0.00',
      discountAmount: '0.00',
      description: 'Compra realizada',
    });

    expect(prisma.installment.updateMany).toHaveBeenCalledWith({
      where: {
        id: input.installmentId,
        tenantId: input.tenantId,
        installmentPlanId: input.installmentPlanId,
        status: 'PENDING',
        transactionId: null,
      },
      data: {
        status: 'PAID',
        paidAt,
        transactionId: 'transaction-1',
      },
    });

    expect(result).toEqual({
      installmentId: input.installmentId,
      installmentPlanId: input.installmentPlanId,
      transactionId: 'transaction-1',
      installmentNumber: 1,
      status: 'PAID',
      amount: '100.00',
      totalSettledAmount: '100.00',
      remainingAmount: '0.00',
      paidAt,
    });
  });

  it("registra uma liquidação parcial sem marcar a parcela como paga", async () => {
    const partial = createPartiallySettledObligation();
    settleObligation.execute.mockResolvedValue(partial);

    const result = await useCase.execute({
      ...input,
      accountId: "account-2",
      paymentMethod: FinancialPaymentMethod.PIX,
      principalAmount: "40.00",
      interestAmount: "2.00",
      discountAmount: "5.00",
    });

    expect(settleObligation.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "account-2",
        paymentMethod: FinancialPaymentMethod.PIX,
        principalAmount: "40.00",
        interestAmount: "2.00",
        discountAmount: "5.00",
      }),
    );
    expect(prisma.installment.updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({
      installmentId: input.installmentId,
      installmentPlanId: input.installmentPlanId,
      transactionId: null,
      installmentNumber: 1,
      status: "PENDING",
      amount: "100.00",
      totalSettledAmount: "37.00",
      remainingAmount: "60.00",
      paidAt: null,
    });
  });

  it("liquida o saldo restante e só então marca a parcela como paga", async () => {
    obligations.findBySource.mockResolvedValue(
      createPartiallySettledObligation(),
    );
    const settled = createFullySettledAfterPartialObligation();
    settleObligation.execute.mockResolvedValue(settled);

    const result = await useCase.execute(input);

    expect(settleObligation.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        principalAmount: "60.00",
      }),
    );
    expect(prisma.installment.updateMany).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("PAID");
    expect(result.totalSettledAmount).toBe("97.00");
    expect(result.remainingAmount).toBe("0.00");
    expect(result.transactionId).toBe("transaction-2");
  });

  it("recupera uma liquidação parcial feita por requisição concorrente", async () => {
    const partial = createPartiallySettledObligation();
    obligations.findBySource
      .mockResolvedValueOnce(createObligation())
      .mockResolvedValueOnce(partial);
    settleObligation.execute.mockRejectedValue(
      new ConflictException("Conflito concorrente."),
    );

    const result = await useCase.execute(input);

    expect(result.status).toBe("PENDING");
    expect(result.totalSettledAmount).toBe("37.00");
    expect(result.remainingAmount).toBe("60.00");
    expect(result.paidAt).toBeNull();
    expect(prisma.installment.updateMany).not.toHaveBeenCalled();
  });

  it("propaga o erro quando não existe uma nova liquidação parcial concorrente", async () => {
    const partial = createPartiallySettledObligation();
    obligations.findBySource
      .mockResolvedValueOnce(partial)
      .mockResolvedValueOnce(partial);
    const error = new BadRequestException("Valor de liquidação inválido.");
    settleObligation.execute.mockRejectedValue(error);

    await expect(useCase.execute(input)).rejects.toBe(error);
    expect(prisma.installment.updateMany).not.toHaveBeenCalled();
  });

  it('cria obrigação vinculada quando o plano ainda não possui uma', async () => {
    obligations.findBySource.mockResolvedValue(null);
    obligations.createOrFindBySource.mockResolvedValue(createObligation());

    await useCase.execute(input);

    expect(obligations.createOrFindBySource).toHaveBeenCalledTimes(1);
    const created = obligations.createOrFindBySource.mock.calls[0][0];

    expect(created.sourceType).toBe(FinancialObligationSourceType.INSTALLMENT);
    expect(created.sourceId).toBe(input.installmentId);
    expect(created.amount).toBe('100.00');
  });

  it('recupera parcela já paga sem repetir a liquidação', async () => {
    prisma.installment.findFirst.mockResolvedValue(
      createInstallment({
        status: 'PAID',
        transactionId: 'transaction-1',
        paidAt,
      }),
    );
    obligations.findBySource.mockResolvedValue(createSettledObligation());

    const result = await useCase.execute(input);

    expect(result.status).toBe('PAID');
    expect(result.transactionId).toBe('transaction-1');
    expect(settleObligation.execute).not.toHaveBeenCalled();
    expect(prisma.installment.updateMany).not.toHaveBeenCalled();
  });

  it('recupera liquidação concluída antes da sincronização da parcela', async () => {
    obligations.findBySource.mockResolvedValue(createSettledObligation());

    const result = await useCase.execute(input);

    expect(settleObligation.execute).not.toHaveBeenCalled();
    expect(prisma.installment.updateMany).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('PAID');
  });

  it('recupera liquidação feita por requisição concorrente', async () => {
    obligations.findBySource
      .mockResolvedValueOnce(createObligation())
      .mockResolvedValueOnce(createSettledObligation());

    settleObligation.execute.mockRejectedValue(
      new ConflictException('Conflito concorrente.'),
    );

    const result = await useCase.execute(input);

    expect(settleObligation.execute).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('PAID');
    expect(result.transactionId).toBe('transaction-1');
  });

  it('reconhece sincronização concorrente da parcela', async () => {
    prisma.installment.updateMany.mockResolvedValue({ count: 0 });
    prisma.installment.findFirst
      .mockResolvedValueOnce(createInstallment())
      .mockResolvedValueOnce(
        createInstallment({
          status: 'PAID',
          transactionId: 'transaction-1',
          paidAt,
        }),
      );

    const result = await useCase.execute(input);

    expect(result.status).toBe('PAID');
    expect(result.transactionId).toBe('transaction-1');
  });

  it('não esconde falha de autorização da liquidação central', async () => {
    settleObligation.execute.mockRejectedValue(
      new ForbiddenException('Você não tem permissão.'),
    );

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    expect(prisma.installment.updateMany).not.toHaveBeenCalled();
  });

  it('rejeita parcela de outro Espaço', async () => {
    prisma.installment.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(obligations.findBySource).not.toHaveBeenCalled();
    expect(settleObligation.execute).not.toHaveBeenCalled();
  });

  it('rejeita parcela já paga sem obrigação liquidada correspondente', async () => {
    prisma.installment.findFirst.mockResolvedValue(
      createInstallment({ status: 'PAID' }),
    );
    obligations.findBySource.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(settleObligation.execute).not.toHaveBeenCalled();
  });

  it('rejeita data inválida antes de consultar a parcela', async () => {
    await expect(
      useCase.execute({ ...input, paidAt: 'invalid-date' }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.installment.findFirst).not.toHaveBeenCalled();
  });

  it('informa quando a liquidação ocorreu mas a parcela não sincronizou', async () => {
    prisma.installment.updateMany.mockResolvedValue({ count: 0 });
    prisma.installment.findFirst
      .mockResolvedValueOnce(createInstallment())
      .mockResolvedValueOnce(createInstallment());

    await expect(useCase.execute(input)).rejects.toThrow(
      'A liquidação foi registrada, mas a parcela precisa ser sincronizada. Tente novamente.',
    );
  });
});
