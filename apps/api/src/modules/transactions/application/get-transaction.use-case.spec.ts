import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { GetTransactionUseCase } from './get-transaction.use-case';

describe('GetTransactionUseCase', () => {
  let useCase: GetTransactionUseCase;
  let findFirst: jest.Mock;

  beforeEach(() => {
    findFirst = jest.fn().mockResolvedValue({ id: 'transaction-1' });

    useCase = new GetTransactionUseCase({
      transaction: { findFirst },
    } as unknown as PrismaService);
  });

  it('consulta por identificador, Espaço, usuário e vínculo ativo', async () => {
    const result = await useCase.execute('tenant-1', 'user-1', 'transaction-1');

    expect(result).toEqual({ id: 'transaction-1' });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'transaction-1',
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
    });
  });

  it('retorna não encontrado quando a transação não está acessível', async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      useCase.execute('tenant-1', 'user-1', 'transaction-foreign'),
    ).rejects.toThrow(NotFoundException);
  });
});
