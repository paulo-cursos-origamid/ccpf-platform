import { TransactionType } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ListTransactionsUseCase } from './list-transactions.use-case';

describe('ListTransactionsUseCase', () => {
  let useCase: ListTransactionsUseCase;
  let findMany: jest.Mock;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([{ id: 'transaction-1' }]);

    useCase = new ListTransactionsUseCase({
      transaction: { findMany },
    } as unknown as PrismaService);
  });

  it('filtra pelo Espaço, usuário, exclusão lógica e vínculo ativo', async () => {
    const result = await useCase.execute('tenant-1', 'user-1');

    expect(result).toEqual([{ id: 'transaction-1' }]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        deletedAt: null,
        account: {
          accountMembers: {
            some: { userId: 'user-1', status: 'ACTIVE' },
          },
        },
      },
      include: {
        account: true,
        category: true,
        subCategory: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('aplica o filtro de tipo quando informado', async () => {
    await useCase.execute('tenant-1', 'user-1', TransactionType.EXPENSE);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          type: TransactionType.EXPENSE,
        }),
      }),
    );
  });

  it('não aplica filtro de tipo quando não informado', async () => {
    await useCase.execute('tenant-1', 'user-1');

    expect(findMany.mock.calls[0][0].where).not.toHaveProperty('type');
  });
});
