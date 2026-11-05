import { Prisma, RecurringBillFrequency } from '@prisma/client';
import { FinancialObligationSourceType } from '../../accounts-payable-receivable/domain/enums/financial-obligation-source-type.enum';
import { FinancialObligationType } from '../../accounts-payable-receivable/domain/enums/financial-obligation-type.enum';
import { FinancialObligationRepository } from '../../accounts-payable-receivable/domain/repositories/financial-obligation.repository';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { GenerateRecurringBillOccurrencesUseCase } from './generate-recurring-bill-occurrences.use-case';

describe('GenerateRecurringBillOccurrencesUseCase', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const billId = 'bill-1';
  const occurrenceDate = new Date('2026-11-15T12:00:00.000Z');

  let prisma: any;
  let obligations: any;
  let useCase: GenerateRecurringBillOccurrencesUseCase;

  const occurrence = (expectedAmount: string | null = '150.00') => ({
    id: 'occurrence-1',
    dueDate: occurrenceDate,
    expectedAmount:
      expectedAmount === null ? null : new Prisma.Decimal(expectedAmount),
    paidAmount: null,
  });

  const bill = (overrides: Record<string, unknown> = {}) => ({
    id: billId,
    tenantId,
    userId,
    accountId: 'account-1',
    categoryId: 'category-1',
    subCategoryId: null,
    title: 'Conta de energia',
    expectedAmount: new Prisma.Decimal('150.00'),
    frequency: RecurringBillFrequency.MONTHLY,
    dueDay: 15,
    startDate: new Date('2026-11-01T00:00:00.000Z'),
    endDate: null,
    description: 'Conta mensal',
    isActive: true,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      recurringBill: {
        findFirst: jest.fn().mockResolvedValue(bill()),
      },
      accountMember: {
        findFirst: jest.fn().mockResolvedValue({ role: 'OWNER' }),
      },
      recurringBillOccurrence: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([occurrence()]),
      },
    };

    obligations = {
      createOrFindBySource: jest.fn().mockImplementation(
        async (item) => item,
      ),
    };

    useCase = new GenerateRecurringBillOccurrencesUseCase(
      prisma as PrismaService,
      obligations as FinancialObligationRepository,
    );
  });

  it('cria obrigação vinculada para ocorrência com valor previsto', async () => {
    const result = await useCase.execute(tenantId, userId, billId);

    expect(result).toHaveLength(1);
    expect(obligations.createOrFindBySource).toHaveBeenCalledTimes(1);

    const created = obligations.createOrFindBySource.mock.calls[0][0];

    expect(created.type).toBe(FinancialObligationType.PAYABLE);
    expect(created.amount).toBe('150.00');
    expect(created.accountId).toBe('account-1');
    expect(created.categoryId).toBe('category-1');
    expect(created.sourceType).toBe(
      FinancialObligationSourceType.RECURRING_BILL_OCCURRENCE,
    );
    expect(created.sourceId).toBe('occurrence-1');
  });

  it('não cria obrigação quando a ocorrência não possui valor previsto', async () => {
    prisma.recurringBillOccurrence.findMany.mockResolvedValue([
      occurrence(null),
    ]);

    await useCase.execute(tenantId, userId, billId);

    expect(obligations.createOrFindBySource).not.toHaveBeenCalled();
  });

  it('reconcilia obrigações de ocorrências existentes mesmo sem gerar novas', async () => {
    prisma.recurringBill.findFirst.mockResolvedValue(
      bill({ isActive: false }),
    );

    await useCase.execute(tenantId, userId, billId);

    expect(prisma.recurringBillOccurrence.createMany).not.toHaveBeenCalled();
    expect(obligations.createOrFindBySource).toHaveBeenCalledTimes(1);
  });
});
