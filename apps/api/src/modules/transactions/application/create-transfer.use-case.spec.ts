import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateTransferUseCase } from './create-transfer.use-case';

describe('CreateTransferUseCase', () => {
  const input = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    fromAccountId: 'account-1',
    toAccountId: 'account-2',
    amount: '125.50',
    description: 'Transferência de teste',
  };

  const fromAccount = {
    id: 'account-1',
    tenantId: 'tenant-1',
    balance: new Prisma.Decimal('500.00'),
  };

  const toAccount = {
    id: 'account-2',
    tenantId: 'tenant-1',
    balance: new Prisma.Decimal('100.00'),
  };

  let prisma: any;
  let tx: any;
  let useCase: CreateTransferUseCase;

  beforeEach(() => {
    tx = {
      account: {
        findMany: jest.fn().mockResolvedValue([fromAccount, toAccount]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      accountMember: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { accountId: 'account-1' },
            { accountId: 'account-2' },
          ]),
      },
      transfer: {
        create: jest.fn().mockResolvedValue({
          id: 'transfer-1',
          ...input,
        }),
      },
      ledgerEntry: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    prisma = {
      $transaction: jest.fn((callback) => callback(tx)),
    };

    useCase = new CreateTransferUseCase(prisma);
  });

  it('cria transferência e registra débito e crédito', async () => {
    const result = await useCase.execute(input);

    expect(result.id).toBe('transfer-1');
    expect(tx.transfer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        userId: 'user-1',
        fromAccountId: 'account-1',
        toAccountId: 'account-2',
        amount: new Prisma.Decimal('125.50'),
      }),
    });

    expect(tx.ledgerEntry.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          accountId: 'account-1',
          type: 'DEBIT',
          referenceId: 'transfer-1',
          referenceType: 'TRANSFER',
        }),
        expect.objectContaining({
          accountId: 'account-2',
          type: 'CREDIT',
          referenceId: 'transfer-1',
          referenceType: 'TRANSFER',
        }),
      ]),
    });

    expect(tx.account.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'account-1',
          tenantId: 'tenant-1',
        }),
        data: { balance: { decrement: new Prisma.Decimal('125.50') } },
      }),
    );

    expect(tx.account.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'account-2',
          tenantId: 'tenant-1',
        }),
        data: { balance: { increment: new Prisma.Decimal('125.50') } },
      }),
    );
  });

  it.each(['0', '-1', 'abc'])('rejeita valor inválido: %s', async (amount) => {
    await expect(useCase.execute({ ...input, amount })).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita transferência para a mesma conta', async () => {
    await expect(
      useCase.execute({ ...input, toAccountId: input.fromAccountId }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita conta inexistente ou de outro Espaço', async () => {
    tx.account.findMany.mockResolvedValue([fromAccount]);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.transfer.create).not.toHaveBeenCalled();
  });

  it('exige acesso ativo às duas contas', async () => {
    tx.accountMember.findMany.mockResolvedValue([{ accountId: 'account-1' }]);

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);
    expect(tx.transfer.create).not.toHaveBeenCalled();
  });

  it('não atualiza saldos se o registro dos lançamentos falhar', async () => {
    tx.ledgerEntry.createMany.mockRejectedValue(
      new Error('Falha ao gravar lançamentos'),
    );

    await expect(useCase.execute(input)).rejects.toThrow(
      'Falha ao gravar lançamentos',
    );

    expect(tx.account.updateMany).not.toHaveBeenCalled();
  });

  it('interrompe a operação se a conta de origem deixar de estar disponível', async () => {
    tx.account.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.account.updateMany).toHaveBeenCalledTimes(1);
  });

  it('interrompe a operação se a conta de destino deixar de estar disponível', async () => {
    tx.account.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
    expect(tx.account.updateMany).toHaveBeenCalledTimes(2);
  });
});
