import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { FinancialObligationEntity } from '../../accounts-payable-receivable/domain/entities/financial-obligation.entity';
import { FinancialObligationSettlementEntity } from '../../accounts-payable-receivable/domain/entities/financial-obligation-settlement.entity';
import { FinancialObligationStatus } from '../../accounts-payable-receivable/domain/enums/financial-obligation-status.enum';
import { FinancialObligationSourceType } from '../../accounts-payable-receivable/domain/enums/financial-obligation-source-type.enum';
import { FinancialObligationType } from '../../accounts-payable-receivable/domain/enums/financial-obligation-type.enum';
import { FinancialObligationRepository } from '../../accounts-payable-receivable/domain/repositories/financial-obligation.repository';
import { SettleFinancialObligationUseCase } from '../../accounts-payable-receivable/application/use-cases/settle-financial-obligation/settle-financial-obligation.use-case';
import { PayRecurringBillUseCase } from './pay-recurring-bill.use-case';

describe('PayRecurringBillUseCase', () => {
  const paidAt = new Date('2026-10-25T12:00:00.000Z');
  const input = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    recurringBillId: 'bill-1',
    occurrenceId: 'occurrence-1',
    amount: '150.00',
    paidAt: paidAt.toISOString(),
  };

  let prisma: any;
  let obligations: any;
  let settleObligation: any;
  let useCase: PayRecurringBillUseCase;

  const createObligation = () =>
    new FinancialObligationEntity({
      id: 'obligation-1',
      tenantId: input.tenantId,
      userId: input.userId,
      accountId: 'account-1',
      categoryId: 'category-1',
      type: FinancialObligationType.PAYABLE,
      title: 'Conta de energia',
      amount: '150.00',
      dueDate: paidAt,
      sourceType: FinancialObligationSourceType.RECURRING_BILL_OCCURRENCE,
      sourceId: input.occurrenceId,
    });

  const createSettledObligation = (
    options: {
      interestAmount?: string;
      discountAmount?: string;
      feeAmount?: string;
    } = {},
  ) => {
    const base = createObligation();
    const settlement = new FinancialObligationSettlementEntity({
      obligationId: base.id,
      tenantId: base.tenantId,
      userId: input.userId,
      accountId: base.accountId,
      principalAmount: '150.00',
      interestAmount: options.interestAmount ?? '0.00',
      feeAmount: options.feeAmount ?? '0.00',
      discountAmount: options.discountAmount ?? '0.00',
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

  const recurringOccurrence = (overrides: Record<string, unknown> = {}) => ({
    id: input.occurrenceId,
    tenantId: input.tenantId,
    recurringBillId: input.recurringBillId,
    status: 'PENDING',
    transactionId: null,
    dueDate: paidAt,
    expectedAmount: new Prisma.Decimal('150.00'),
    recurringBill: {
      id: input.recurringBillId,
      tenantId: input.tenantId,
      userId: input.userId,
      accountId: 'account-1',
      categoryId: 'category-1',
      subCategoryId: null,
      title: 'Conta de energia',
      description: 'Conta mensal',
    },
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      recurringBillOccurrence: {
        findFirst: jest.fn().mockResolvedValue(recurringOccurrence()),
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

    useCase = new PayRecurringBillUseCase(
      prisma as PrismaService,
      obligations as FinancialObligationRepository,
      settleObligation as SettleFinancialObligationUseCase,
    );
  });

  it('liquida a obrigação central e sincroniza a ocorrência', async () => {
    const result = await useCase.execute(input);

    expect(settleObligation.execute).toHaveBeenCalledWith({
      id: 'obligation-1',
      tenantId: input.tenantId,
      userId: input.userId,
      settledAt: paidAt,
      principalAmount: '150.00',
      interestAmount: '0.00',
      feeAmount: '0.00',
      discountAmount: '0.00',
      description: 'Conta mensal',
    });

    expect(prisma.recurringBillOccurrence.updateMany).toHaveBeenCalledWith({
      where: {
        id: input.occurrenceId,
        tenantId: input.tenantId,
        recurringBillId: input.recurringBillId,
        status: 'PENDING',
        transactionId: null,
      },
      data: {
        status: 'PAID',
        paidAmount: new Prisma.Decimal('150.00'),
        paidAt,
        transactionId: 'transaction-1',
      },
    });

    expect(result).toEqual({
      occurrenceId: input.occurrenceId,
      recurringBillId: input.recurringBillId,
      transactionId: 'transaction-1',
      status: 'PAID',
      paidAmount: '150.00',
      paidAt,
    });
  });

  it('registra diferença menor como desconto', async () => {
    await useCase.execute({ ...input, amount: '140.00' });

    expect(settleObligation.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        principalAmount: '150.00',
        discountAmount: '10.00',
        interestAmount: '0.00',
      }),
    );
  });

  it('registra diferença maior como juros', async () => {
    await useCase.execute({ ...input, amount: '160.00' });

    expect(settleObligation.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        principalAmount: '150.00',
        discountAmount: '0.00',
        interestAmount: '10.00',
      }),
    );
  });

  it('cria a obrigação por origem quando ainda não existe', async () => {
    obligations.findBySource.mockResolvedValue(null);

    await useCase.execute(input);

    expect(obligations.createOrFindBySource).toHaveBeenCalledTimes(1);
    const created = obligations.createOrFindBySource.mock.calls[0][0];

    expect(created.sourceType).toBe(
      FinancialObligationSourceType.RECURRING_BILL_OCCURRENCE,
    );
    expect(created.sourceId).toBe(input.occurrenceId);
    expect(created.amount).toBe('150.00');
  });

  it('usa o valor pago quando a ocorrência não possui valor previsto', async () => {
    obligations.findBySource.mockResolvedValue(null);
    prisma.recurringBillOccurrence.findFirst.mockResolvedValue(
      recurringOccurrence({ expectedAmount: null }),
    );

    await useCase.execute({ ...input, amount: '175.00' });

    const created = obligations.createOrFindBySource.mock.calls[0][0];
    expect(created.amount).toBe('175.00');
  });

  it('recupera obrigação já liquidada sem criar nova movimentação', async () => {
    obligations.findBySource.mockResolvedValue(createSettledObligation());

    const result = await useCase.execute(input);

    expect(settleObligation.execute).not.toHaveBeenCalled();
    expect(prisma.recurringBillOccurrence.updateMany).toHaveBeenCalledTimes(1);
    expect(result.transactionId).toBe('transaction-1');
  });

  it('recupera liquidação concluída por uma requisição concorrente', async () => {
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

  it('reconhece uma ocorrência já paga sem repetir a liquidação', async () => {
    obligations.findBySource.mockResolvedValue(createSettledObligation());
    prisma.recurringBillOccurrence.findFirst.mockResolvedValue(
      recurringOccurrence({
        status: 'PAID',
        transactionId: 'transaction-1',
        paidAmount: new Prisma.Decimal('150.00'),
        paidAt,
      }),
    );

    const result = await useCase.execute(input);

    expect(result.status).toBe('PAID');
    expect(result.transactionId).toBe('transaction-1');
    expect(result.paidAmount).toBe('150.00');
    expect(settleObligation.execute).not.toHaveBeenCalled();
    expect(prisma.recurringBillOccurrence.updateMany).not.toHaveBeenCalled();
  });

  it('informa quando a obrigação foi liquidada mas a ocorrência não sincronizou', async () => {
    prisma.recurringBillOccurrence.updateMany.mockResolvedValue({ count: 0 });
    prisma.recurringBillOccurrence.findFirst.mockResolvedValue(
      recurringOccurrence(),
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      'A liquidação foi registrada, mas o vencimento precisa ser sincronizado. Tente novamente.',
    );
  });

  it('rejeita vencimento de outro Espaço', async () => {
    prisma.recurringBillOccurrence.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(obligations.findBySource).not.toHaveBeenCalled();
    expect(settleObligation.execute).not.toHaveBeenCalled();
  });

  it('rejeita ocorrência já paga ou cancelada', async () => {
    prisma.recurringBillOccurrence.findFirst.mockResolvedValue(
      recurringOccurrence({ status: 'PAID' }),
    );

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
    expect(settleObligation.execute).not.toHaveBeenCalled();
  });

  it('rejeita valor inválido antes de consultar a ocorrência', async () => {
    await expect(useCase.execute({ ...input, amount: '0' })).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.recurringBillOccurrence.findFirst).not.toHaveBeenCalled();
  });

  it('rejeita data inválida antes de consultar a ocorrência', async () => {
    await expect(
      useCase.execute({ ...input, paidAt: 'invalid-date' }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.recurringBillOccurrence.findFirst).not.toHaveBeenCalled();
  });

  it('mantém o erro de autorização quando a obrigação não foi liquidada', async () => {
    settleObligation.execute.mockRejectedValue(
      new ForbiddenException('Você não tem permissão para liquidar.'),
    );
    obligations.findBySource
      .mockResolvedValueOnce(createObligation())
      .mockResolvedValueOnce(createObligation());

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    expect(prisma.recurringBillOccurrence.updateMany).not.toHaveBeenCalled();
  });
});
