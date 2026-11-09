import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { FinancialObligationEntity } from '../../../domain/entities/financial-obligation.entity';
import { FinancialObligationRepository } from '../../../domain/repositories/financial-obligation.repository';
import { FinancialObligationSourceType } from '../../../domain/enums/financial-obligation-source-type.enum';
import { FinancialObligationStatus } from '../../../domain/enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../../../domain/enums/financial-obligation-type.enum';
import { FinancialObligationsApplicationService } from '../../financial-obligations-application.service';
import { SettleFinancialObligationUseCase } from './settle-financial-obligation.use-case';

describe('SettleFinancialObligationUseCase', () => {
  const settledAt = new Date('2026-11-06T12:00:00.000Z');

  const createObligation = (
    overrides: Partial<ConstructorParameters<typeof FinancialObligationEntity>[0]> = {},
  ) =>
    new FinancialObligationEntity({
      id: 'obligation-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: 'account-1',
      categoryId: 'category-1',
      type: FinancialObligationType.PAYABLE,
      title: 'Compromisso de teste',
      amount: '100.00',
      dueDate: new Date('2026-11-10T12:00:00.000Z'),
      ...overrides,
    });

  let obligation: FinancialObligationEntity;

  const repository = {
    settle: jest.fn(),
  };

  const obligations = {
    findObligation: jest.fn(),
    validateReferences: jest.fn(),
    assertAccountAccess: jest.fn(),
    assertTenantWriteAccess: jest.fn(),
    parseDate: jest.fn((date: Date) => date),
  };

  let useCase: SettleFinancialObligationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    obligation = createObligation();

    obligations.findObligation.mockResolvedValue(obligation);
    obligations.validateReferences.mockResolvedValue(undefined);
    obligations.assertAccountAccess.mockResolvedValue(undefined);
    obligations.assertTenantWriteAccess.mockResolvedValue(undefined);

    repository.settle.mockImplementation(
      async (entity: FinancialObligationEntity) => entity,
    );

    useCase = new SettleFinancialObligationUseCase(
      repository as unknown as FinancialObligationRepository,
      obligations as unknown as FinancialObligationsApplicationService,
    );
  });

  it('settles a regular obligation using its reference account', async () => {
    const result = await useCase.execute({
      id: obligation.id,
      tenantId: obligation.tenantId,
      userId: obligation.userId,
      settledAt,
    });

    expect(obligations.validateReferences).toHaveBeenCalledWith({
      accountId: 'account-1',
      categoryId: 'category-1',
      subCategoryId: null,
      type: FinancialObligationType.PAYABLE,
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(obligations.assertAccountAccess).not.toHaveBeenCalled();
    expect(repository.settle).toHaveBeenCalledTimes(1);

    const [settledObligation, options] = repository.settle.mock.calls[0];

    expect(settledObligation.status).toBe(FinancialObligationStatus.SETTLED);
    expect(options.settlement.accountId).toBe('account-1');
    expect(options.settlement.principalAmount).toBe('100.00');
    expect(options.settlement.transactionId).toBeNull();
    expect(result).toBe(obligation);
  });

  it('settles a card invoice using the selected account without requiring a category', async () => {
    obligation = createObligation({
      accountId: null,
      categoryId: null,
      sourceType: FinancialObligationSourceType.CREDIT_CARD_INVOICE,
      sourceId: 'invoice-1',
    });
    obligations.findObligation.mockResolvedValue(obligation);

    await useCase.execute({
      id: obligation.id,
      tenantId: obligation.tenantId,
      userId: obligation.userId,
      accountId: 'account-2',
      settledAt,
    });

    expect(obligations.assertTenantWriteAccess).toHaveBeenCalledWith(
      'tenant-1',
      'user-1',
    );
    expect(obligations.assertAccountAccess).toHaveBeenCalledWith(
      'account-2',
      'tenant-1',
      'user-1',
    );
    expect(obligations.validateReferences).not.toHaveBeenCalled();

    const [settledObligation, options] = repository.settle.mock.calls[0];

    expect(settledObligation.status).toBe(FinancialObligationStatus.SETTLED);
    expect(options.settlement.accountId).toBe('account-2');
    expect(options.settlement.transactionId).toBeNull();
  });

  it('rejects a card invoice payment when the tenant member cannot write', async () => {
    obligation = createObligation({
      accountId: null,
      categoryId: null,
      sourceType: FinancialObligationSourceType.CREDIT_CARD_INVOICE,
      sourceId: 'invoice-1',
    });
    obligations.findObligation.mockResolvedValue(obligation);
    obligations.assertTenantWriteAccess.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      useCase.execute({
        id: obligation.id,
        tenantId: obligation.tenantId,
        userId: obligation.userId,
        accountId: 'account-2',
        settledAt,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(obligations.assertAccountAccess).not.toHaveBeenCalled();
    expect(repository.settle).not.toHaveBeenCalled();
  });

  it('requires an explicitly selected account to settle a card invoice', async () => {
    obligation = createObligation({
      accountId: null,
      categoryId: null,
      sourceType: FinancialObligationSourceType.CREDIT_CARD_INVOICE,
      sourceId: 'invoice-1',
    });
    obligations.findObligation.mockResolvedValue(obligation);

    await expect(
      useCase.execute({
        id: obligation.id,
        tenantId: obligation.tenantId,
        userId: obligation.userId,
        settledAt,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(obligations.assertAccountAccess).not.toHaveBeenCalled();
    expect(repository.settle).not.toHaveBeenCalled();
  });

  it('rejects a transaction link for a card invoice payment', async () => {
    obligation = createObligation({
      accountId: null,
      categoryId: null,
      sourceType: FinancialObligationSourceType.CREDIT_CARD_INVOICE,
      sourceId: 'invoice-1',
    });
    obligations.findObligation.mockResolvedValue(obligation);

    await expect(
      useCase.execute({
        id: obligation.id,
        tenantId: obligation.tenantId,
        userId: obligation.userId,
        settledAt,
        accountId: 'account-2',
        transactionId: 'transaction-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(obligations.assertAccountAccess).not.toHaveBeenCalled();
    expect(repository.settle).not.toHaveBeenCalled();
  });

  it('rejects an alternative account for a regular obligation', async () => {
    await expect(
      useCase.execute({
        id: obligation.id,
        tenantId: obligation.tenantId,
        userId: obligation.userId,
        accountId: 'account-2',
        settledAt,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(obligations.validateReferences).not.toHaveBeenCalled();
    expect(repository.settle).not.toHaveBeenCalled();
  });

  it('registers a partial settlement and keeps the remaining amount', async () => {
    await useCase.execute({
      id: obligation.id,
      tenantId: obligation.tenantId,
      userId: obligation.userId,
      settledAt,
      principalAmount: '30.00',
    });

    const [settledObligation, options] = repository.settle.mock.calls[0];

    expect(settledObligation.status).toBe(
      FinancialObligationStatus.PARTIALLY_SETTLED,
    );
    expect(settledObligation.remainingAmount).toBe('70.00');
    expect(options.settlement.principalAmount).toBe('30.00');
  });

  it('uses the full remaining principal when omitted and applies the discount to the cash amount', async () => {
    await useCase.execute({
      id: obligation.id,
      tenantId: obligation.tenantId,
      userId: obligation.userId,
      settledAt,
      discountAmount: '10.00',
    });

    const [settledObligation, options] = repository.settle.mock.calls[0];

    expect(settledObligation.status).toBe(FinancialObligationStatus.SETTLED);
    expect(settledObligation.remainingAmount).toBe('0.00');
    expect(options.settlement.principalAmount).toBe('100.00');
    expect(options.settlement.discountAmount).toBe('10.00');
    expect(options.settlement.settledAmount).toBe('90.00');
  });
  it('allows a full-discount settlement with no cash movement', async () => {
    await useCase.execute({
      id: obligation.id,
      tenantId: obligation.tenantId,
      userId: obligation.userId,
      settledAt,
      principalAmount: '100.00',
      discountAmount: '100.00',
    });

    const [settledObligation, options] = repository.settle.mock.calls[0];

    expect(settledObligation.status).toBe(FinancialObligationStatus.SETTLED);
    expect(options.settlement.settledAmount).toBe('0.00');
    expect(options.settlement.discountAmount).toBe('100.00');
  });

  it('rejects a settlement that exceeds the outstanding amount', async () => {
    await expect(
      useCase.execute({
        id: obligation.id,
        tenantId: obligation.tenantId,
        userId: obligation.userId,
        settledAt,
        principalAmount: '120.00',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.settle).not.toHaveBeenCalled();
  });

  it('rejects obligations that are not open', async () => {
    obligation = createObligation({
      status: FinancialObligationStatus.CANCELED,
    });
    obligations.findObligation.mockResolvedValue(obligation);

    await expect(
      useCase.execute({
        id: obligation.id,
        tenantId: obligation.tenantId,
        userId: obligation.userId,
        settledAt,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.settle).not.toHaveBeenCalled();
  });

  it('forwards the settlement description to the repository', async () => {
    await useCase.execute({
      id: obligation.id,
      tenantId: obligation.tenantId,
      userId: obligation.userId,
      settledAt,
      description: 'Pagamento realizado pelo teste',
    });

    expect(repository.settle).toHaveBeenCalledWith(
      obligation,
      expect.objectContaining({
        description: 'Pagamento realizado pelo teste',
        settlement: expect.any(Object),
      }),
    );
  });
});
