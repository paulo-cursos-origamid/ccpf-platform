import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateRecurringBillUseCase } from './update-recurring-bill.use-case';

type AsyncMock = jest.Mock<Promise<unknown>, []>;
type MockedTransaction = {
  recurringBill: {
    findFirst: AsyncMock;
    update: AsyncMock;
  };
  recurringBillOccurrence: { updateMany: AsyncMock };
  financialObligation: { updateMany: AsyncMock };
};
type MockedPrisma = {
  $transaction: jest.Mock<
    Promise<unknown>,
    [callback: (transaction: MockedTransaction) => Promise<unknown>]
  >;
};

describe('UpdateRecurringBillUseCase', () => {
  const input = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    recurringBillId: 'bill-1',
    dueDay: 15,
  };

  let tx: MockedTransaction;
  let prisma: MockedPrisma;
  let useCase: UpdateRecurringBillUseCase;

  beforeEach(() => {
    tx = {
      recurringBill: {
        findFirst: jest.fn<Promise<unknown>, []>().mockResolvedValue({
          id: input.recurringBillId,
          userId: input.userId,
          expectedAmount: new Prisma.Decimal('120.00'),
          occurrences: [
            {
              id: 'occurrence-1',
              dueDate: new Date('2099-10-10T12:00:00.000Z'),
              referenceMonth: new Date('2099-10-01T00:00:00.000Z'),
            },
          ],
        }),
        update: jest.fn<Promise<unknown>, []>().mockResolvedValue({
          id: input.recurringBillId,
          dueDay: input.dueDay,
        }),
      },
      recurringBillOccurrence: {
        updateMany: jest
          .fn<Promise<unknown>, []>()
          .mockResolvedValue({ count: 1 }),
      },
      financialObligation: {
        updateMany: jest
          .fn<Promise<unknown>, []>()
          .mockResolvedValue({ count: 1 }),
      },
    };

    prisma = {
      $transaction: jest.fn(
        (callback: (transaction: MockedTransaction) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    useCase = new UpdateRecurringBillUseCase(
      prisma as unknown as PrismaService,
    );
  });

  it('atualiza o dia da conta e os vencimentos pendentes', async () => {
    const result = await useCase.execute(input);

    expect(result.dueDay).toBe(15);
    const whereMatcher: unknown = expect.objectContaining({
      id: input.recurringBillId,
      tenantId: input.tenantId,
    });

    expect(tx.recurringBill.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: whereMatcher,
      }),
    );
    expect(tx.recurringBillOccurrence.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'occurrence-1',
        tenantId: input.tenantId,
        recurringBillId: input.recurringBillId,
        status: 'PENDING',
        transactionId: null,
      },
      data: {
        dueDate: new Date('2099-10-15T00:00:00.000Z'),
      },
    });
    expect(tx.financialObligation.updateMany).toHaveBeenCalledWith({
      where: {
        tenantId: input.tenantId,
        sourceType: 'RECURRING_BILL_OCCURRENCE',
        sourceId: 'occurrence-1',
        status: 'PENDING',
        settlements: { none: {} },
      },
      data: {
        dueDate: new Date('2099-10-15T00:00:00.000Z'),
      },
    });
  });

  it('não sincroniza a obrigação quando a ocorrência não foi atualizada', async () => {
    tx.recurringBillOccurrence.updateMany.mockResolvedValue({ count: 0 });

    await useCase.execute(input);

    expect(tx.financialObligation.updateMany).not.toHaveBeenCalled();
  });

  it('atualiza o valor do cadastro, dos vencimentos pendentes e das obrigações', async () => {
    await useCase.execute({ ...input, expectedAmount: '85.40' });

    expect(tx.recurringBill.update).toHaveBeenCalledWith({
      where: {
        id_tenantId: {
          id: input.recurringBillId,
          tenantId: input.tenantId,
        },
      },
      data: {
        dueDay: input.dueDay,
        expectedAmount: new Prisma.Decimal('85.40'),
      },
    });
    expect(tx.recurringBillOccurrence.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          dueDate: new Date('2099-10-15T00:00:00.000Z'),
          expectedAmount: new Prisma.Decimal('85.40'),
        },
      }),
    );
    expect(tx.financialObligation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          dueDate: new Date('2099-10-15T00:00:00.000Z'),
          amount: new Prisma.Decimal('85.40'),
        },
      }),
    );
  });

  it('rejeita dia de vencimento inválido antes da transação', async () => {
    await expect(useCase.execute({ ...input, dueDay: 32 })).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita valor previsto inválido antes da transação', async () => {
    await expect(
      useCase.execute({ ...input, expectedAmount: '0.00' }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita conta inexistente ou pertencente a outro Espaço', async () => {
    tx.recurringBill.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.recurringBill.update).not.toHaveBeenCalled();
  });

  it('impede outro usuário de editar a conta recorrente', async () => {
    tx.recurringBill.findFirst.mockResolvedValue({
      id: input.recurringBillId,
      userId: 'other-user',
      occurrences: [],
    });

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    expect(tx.recurringBill.update).not.toHaveBeenCalled();
  });

  it('bloqueia edição quando existe vencimento pendente atrasado', async () => {
    tx.recurringBill.findFirst.mockResolvedValue({
      id: input.recurringBillId,
      occurrences: [
        {
          id: 'occurrence-1',
          dueDate: new Date('2020-01-01T12:00:00.000Z'),
          referenceMonth: new Date('2020-01-01T00:00:00.000Z'),
        },
      ],
    });

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    expect(tx.recurringBill.update).not.toHaveBeenCalled();
  });

  it('não atualiza vencimentos pagos ou vinculados a transações', async () => {
    tx.recurringBill.findFirst.mockResolvedValue({
      id: input.recurringBillId,
      userId: input.userId,
      occurrences: [],
    });

    await useCase.execute(input);

    expect(tx.recurringBillOccurrence.updateMany).not.toHaveBeenCalled();
  });
});
