import { GetFinancialProjectionUseCase } from './get-financial-projection.use-case';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

describe('GetFinancialProjectionUseCase', () => {
  let prisma: any;
  let useCase: GetFinancialProjectionUseCase;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-15T12:00:00.000Z'));

    prisma = {
      account: {
        findMany: jest.fn().mockResolvedValue([{ balance: 1000 }]),
      },
      installmentPlan: {
        findMany: jest.fn().mockResolvedValue([
          {
            installments: [
              {
                amount: 100,
                dueDate: new Date('2026-01-20T00:00:00.000Z'),
                status: 'PENDING',
                transactionId: null,
              },
              {
                amount: 50,
                dueDate: new Date('2026-02-20T00:00:00.000Z'),
                status: 'PENDING',
                transactionId: null,
              },
            ],
          },
        ]),
      },
      recurringBill: {
        findMany: jest.fn().mockResolvedValue([
          {
            frequency: 'MONTHLY',
            dueDay: 10,
            startDate: new Date('2026-01-20T00:00:00.000Z'),
            endDate: new Date('2026-02-05T00:00:00.000Z'),
            expectedAmount: 80,
            occurrences: [],
          },
          {
            frequency: 'MONTHLY',
            dueDay: 10,
            startDate: new Date('2026-01-05T00:00:00.000Z'),
            endDate: new Date('2026-02-20T00:00:00.000Z'),
            expectedAmount: 40,
            occurrences: [],
          },
        ]),
      },
    };

    useCase = new GetFinancialProjectionUseCase(prisma as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('considera o dia exato de início e encerramento das contas recorrentes', async () => {
    const result = await useCase.execute('tenant-1', 'user-1');

    expect(result.months[0].recurringExpenses).toBe(40);
    expect(result.months[1].recurringExpenses).toBe(40);
  });

  it('calcula parcelas, despesas e saldo projetado sem alterar o saldo real', async () => {
    const result = await useCase.execute('tenant-1', 'user-1');

    expect(result.initialBalance).toBe(1000);
    expect(result.months[0].installments).toBe(100);
    expect(result.months[0].expenses).toBe(140);
    expect(result.months[0].projectedBalance).toBe(860);
    expect(result.months[1].installments).toBe(50);
    expect(result.months[1].projectedBalance).toBe(770);
    expect(prisma.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
    );
  });

  it('não inclui parcelas já vinculadas a transações', async () => {
    prisma.installmentPlan.findMany.mockResolvedValue([
      {
        installments: [
          {
            amount: 200,
            dueDate: new Date('2026-01-20T00:00:00.000Z'),
            status: 'PENDING',
            transactionId: 'transaction-1',
          },
        ],
      },
    ]);

    const result = await useCase.execute('tenant-1', 'user-1');

    expect(result.months[0].installments).toBe(0);
  });
});
