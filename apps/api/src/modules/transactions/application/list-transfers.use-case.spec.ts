import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ListTransfersUseCase } from './list-transfers.use-case';

describe('ListTransfersUseCase', () => {
  let prisma: { transfer: { findMany: jest.Mock } };
  let useCase: ListTransfersUseCase;

  beforeEach(() => {
    prisma = {
      transfer: { findMany: jest.fn().mockResolvedValue([]) },
    };

    useCase = new ListTransfersUseCase(prisma as unknown as PrismaService);
  });

  it('filtra pelo Espaço, transferências ativas e acesso às duas contas', async () => {
    await useCase.execute('tenant-1', 'user-1');

    expect(prisma.transfer.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        fromAccount: {
          archivedAt: null,
          accountMembers: {
            some: { userId: 'user-1', status: 'ACTIVE' },
          },
        },
        toAccount: {
          archivedAt: null,
          accountMembers: {
            some: { userId: 'user-1', status: 'ACTIVE' },
          },
        },
      },
      include: {
        fromAccount: { select: { id: true, name: true, currency: true } },
        toAccount: { select: { id: true, name: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('retorna o resultado da consulta', async () => {
    const transfers = [{ id: 'transfer-1' }];
    prisma.transfer.findMany.mockResolvedValue(transfers);

    await expect(useCase.execute('tenant-1', 'user-1')).resolves.toBe(
      transfers,
    );
  });
});
