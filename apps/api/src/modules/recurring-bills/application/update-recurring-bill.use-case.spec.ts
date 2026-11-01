import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { UpdateRecurringBillUseCase } from './update-recurring-bill.use-case';

describe('UpdateRecurringBillUseCase', () => {
  const input = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    recurringBillId: 'bill-1',
    dueDay: 15,
  };

  let tx: any;
  let prisma: any;
  let useCase: UpdateRecurringBillUseCase;

  beforeEach(() => {
    tx = {
      recurringBill: {
        findFirst: jest.fn().mockResolvedValue({
          id: input.recurringBillId,
          occurrences: [
            {
              id: 'occurrence-1',
              dueDate: new Date('2099-10-10T12:00:00.000Z'),
              referenceMonth: new Date('2099-10-01T00:00:00.000Z'),
            },
          ],
        }),
        update: jest.fn().mockResolvedValue({
          id: input.recurringBillId,
          dueDay: input.dueDay,
        }),
      },
      recurringBillOccurrence: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
    };

    useCase = new UpdateRecurringBillUseCase(prisma as PrismaService);
  });

  it('atualiza o dia da conta e os vencimentos pendentes', async () => {
    const result = await useCase.execute(input);

    expect(result.dueDay).toBe(15);
    expect(tx.recurringBill.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: input.recurringBillId,
          tenantId: input.tenantId,
        }),
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
  });

  it('rejeita dia de vencimento inválido antes da transação', async () => {
    await expect(
      useCase.execute({ ...input, dueDay: 32 }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita conta inexistente ou pertencente a outro Espaço', async () => {
    tx.recurringBill.findFirst.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      NotFoundException,
    );
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

    await expect(useCase.execute(input)).rejects.toThrow(
      ForbiddenException,
    );
    expect(tx.recurringBill.update).not.toHaveBeenCalled();
  });

  it('não atualiza vencimentos pagos ou vinculados a transações', async () => {
    tx.recurringBill.findFirst.mockResolvedValue({
      id: input.recurringBillId,
      occurrences: [],
    });

    await useCase.execute(input);

    expect(tx.recurringBillOccurrence.updateMany).not.toHaveBeenCalled();
  });
});
