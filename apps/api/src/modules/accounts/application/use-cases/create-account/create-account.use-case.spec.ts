import {
  LedgerEntryType,
  LedgerReferenceType,
} from '@prisma/client';
import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { AccountType } from '../../../domain/enums/account-type.enum';
import {
  CreateAccountInput,
  CreateAccountUseCase,
} from './create-account.use-case';

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;
  let prisma: { $transaction: jest.Mock };
  let tx: {
    account: { create: jest.Mock };
    accountMember: { create: jest.Mock };
    ledgerEntry: { create: jest.Mock };
  };

  const input: CreateAccountInput = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    name: 'Conta principal',
    type: AccountType.CHECKING,
    currency: 'BRL',
    initialBalance: 100,
  };

  const savedAccount = {
    id: 'account-1',
    tenantId: input.tenantId,
    name: input.name,
    type: input.type,
    currency: input.currency,
    initialBalance: { toString: () => '100' },
    balance: { toString: () => '100' },
    status: 'ACTIVE',
    archivedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    tx = {
      account: {
        create: jest.fn().mockResolvedValue(savedAccount),
      },
      accountMember: {
        create: jest.fn().mockResolvedValue({ id: 'member-1' }),
      },
      ledgerEntry: {
        create: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
      },
    };

    prisma = {
      $transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    useCase = new CreateAccountUseCase(
      prisma as unknown as PrismaService,
    );
  });

  it('cria conta, proprietário e crédito para saldo inicial positivo', async () => {
    const result = await useCase.execute(input);

    expect(result.id).toBe(savedAccount.id);
    expect(tx.account.create).toHaveBeenCalledTimes(1);
    expect(tx.accountMember.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        accountId: savedAccount.id,
        userId: input.userId,
        role: 'OWNER',
      }),
    });
    expect(tx.ledgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: input.tenantId,
        userId: input.userId,
        accountId: savedAccount.id,
        type: LedgerEntryType.CREDIT,
        amount: expect.objectContaining({}),
        referenceId: savedAccount.id,
        referenceType: LedgerReferenceType.ADJUSTMENT,
      }),
    });
  });

  it('registra débito com valor absoluto para saldo inicial negativo', async () => {
    tx.account.create.mockResolvedValue({
      ...savedAccount,
      initialBalance: { toString: () => '-50' },
      balance: { toString: () => '-50' },
    });

    await useCase.execute({ ...input, initialBalance: -50 });

    expect(tx.ledgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: LedgerEntryType.DEBIT,
        amount: expect.objectContaining({}),
        referenceType: LedgerReferenceType.ADJUSTMENT,
      }),
    });

    const ledgerData = tx.ledgerEntry.create.mock.calls[0][0].data;
    expect(Number(ledgerData.amount.toString())).toBe(50);
  });

  it('não cria lançamento para saldo inicial zero', async () => {
    tx.account.create.mockResolvedValue({
      ...savedAccount,
      initialBalance: { toString: () => '0' },
      balance: { toString: () => '0' },
    });

    await useCase.execute({ ...input, initialBalance: 0 });

    expect(tx.ledgerEntry.create).not.toHaveBeenCalled();
    expect(tx.accountMember.create).toHaveBeenCalledTimes(1);
  });

  it('propaga falha ao gravar o lançamento', async () => {
    tx.ledgerEntry.create.mockRejectedValue(
      new Error('Falha ao gravar lançamento'),
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      'Falha ao gravar lançamento',
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
