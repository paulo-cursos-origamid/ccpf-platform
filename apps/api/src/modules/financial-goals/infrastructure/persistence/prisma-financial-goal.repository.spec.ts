import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { FinancialGoalEntity } from '../../domain/entities/financial-goal.entity';
import { FinancialGoalContributionEntity } from '../../domain/entities/financial-goal-contribution.entity';
import { FinancialGoalStatus } from '../../domain/enums/financial-goal-status.enum';
import { PrismaFinancialGoalRepository } from './prisma-financial-goal.repository';

describe('PrismaFinancialGoalRepository', () => {
  const tenantId = 'tenant-a';
  const goalId = 'goal-1';

  let prisma: {
    financialGoal: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      updateMany: jest.Mock;
    };
    financialGoalContribution: {
      create: jest.Mock;
      findMany: jest.Mock;
      aggregate: jest.Mock;
    };
    transfer: {
      aggregate: jest.Mock;
    };
  };

  let repository: PrismaFinancialGoalRepository;

  const goalRecord = {
    id: goalId,
    tenantId,
    userId: 'user-1',
    name: 'Viagem',
    description: null,
    linkedAccountId: null,
    targetAmount: 10000,
    targetDate: null,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = {
      financialGoal: {
        create: jest.fn().mockResolvedValue(goalRecord),
        findFirst: jest.fn().mockResolvedValue(goalRecord),
        findMany: jest.fn().mockResolvedValue([goalRecord]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      financialGoalContribution: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { amount: 1500 },
        }),
      },
      transfer: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { amount: 2500 },
        }),
      },
    };

    repository = new PrismaFinancialGoalRepository(
      prisma as unknown as PrismaService,
    );
  });

  it('cria uma meta associada ao Espaço informado na entidade', async () => {
    const goal = new FinancialGoalEntity({
      tenantId,
      userId: 'user-1',
      name: 'Viagem',
      targetAmount: 10000,
    });

    const result = await repository.create(goal);

    expect(prisma.financialGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          userId: 'user-1',
          name: 'Viagem',
        }),
      }),
    );
    expect(result).toBeInstanceOf(FinancialGoalEntity);
    expect(result.tenantId).toBe(tenantId);
  });

  it('consulta uma meta pelo ID e tenantId, ignorando excluídas', async () => {
    await repository.findById(goalId, tenantId);

    expect(prisma.financialGoal.findFirst).toHaveBeenCalledWith({
      where: {
        id: goalId,
        tenantId,
        deletedAt: null,
      },
    });
  });

  it('lista todas as metas ativas do Espaço sem restringir pelo criador', async () => {
    await repository.findMany(tenantId);

    expect(prisma.financialGoal.findMany).toHaveBeenCalledWith({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('retorna null quando a meta não pertence ao Espaço', async () => {
    prisma.financialGoal.findFirst.mockResolvedValue(null);

    const result = await repository.findById(goalId, 'tenant-b');

    expect(result).toBeNull();
    expect(prisma.financialGoal.findFirst).toHaveBeenCalledWith({
      where: {
        id: goalId,
        tenantId: 'tenant-b',
        deletedAt: null,
      },
    });
  });

  it('atualiza uma meta usando ID e tenantId', async () => {
    const goal = new FinancialGoalEntity({
      id: goalId,
      tenantId,
      userId: 'user-1',
      name: 'Viagem atualizada',
      targetAmount: 12000,
    });

    prisma.financialGoal.findFirst.mockResolvedValue({
      ...goalRecord,
      name: 'Viagem atualizada',
      targetAmount: 12000,
    });

    const result = await repository.update(goal, tenantId);

    expect(prisma.financialGoal.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: goalId,
          tenantId,
          deletedAt: null,
        },
      }),
    );
    expect(result.name).toBe('Viagem atualizada');
  });

  it('cria aporte manual com tenantId e goalId', async () => {
    const contributionRecord = {
      id: 'contribution-1',
      tenantId,
      goalId,
      userId: 'user-1',
      amount: 500,
      date: new Date(),
      description: 'Aporte',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    prisma.financialGoalContribution.create.mockResolvedValue(
      contributionRecord,
    );

    const contribution = new FinancialGoalContributionEntity({
      tenantId,
      goalId,
      userId: 'user-1',
      amount: 500,
      description: 'Aporte',
    });

    const result = await repository.createContribution(contribution);

    expect(prisma.financialGoalContribution.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          goalId,
          amount: 500,
        }),
      }),
    );
    expect(result).toBeInstanceOf(FinancialGoalContributionEntity);
  });

  it('lista somente aportes ativos da meta no Espaço', async () => {
    await repository.listContributions(goalId, tenantId);

    expect(
      prisma.financialGoalContribution.findMany,
    ).toHaveBeenCalledWith({
      where: {
        goalId,
        tenantId,
        deletedAt: null,
      },
      orderBy: { date: 'desc' },
    });
  });

  it('calcula progresso somando aportes e transferências não estornados', async () => {
    const result = await repository.getProgress(goalId, tenantId, 10000);

    expect(
      prisma.financialGoalContribution.aggregate,
    ).toHaveBeenCalledWith({
      where: {
        goalId,
        tenantId,
        deletedAt: null,
      },
      _sum: { amount: true },
    });

    expect(prisma.transfer.aggregate).toHaveBeenCalledWith({
      where: {
        financialGoalId: goalId,
        tenantId,
        deletedAt: null,
      },
      _sum: { amount: true },
    });

    expect(result).toEqual({
      contributionsAmount: 1500,
      transfersAmount: 2500,
      totalAmount: 4000,
      remainingAmount: 6000,
      percentage: 40,
    });
  });

  it('limita percentual a 100 e restante a zero quando ultrapassa o alvo', async () => {
    prisma.financialGoalContribution.aggregate.mockResolvedValue({
      _sum: { amount: 8000 },
    });
    prisma.transfer.aggregate.mockResolvedValue({
      _sum: { amount: 5000 },
    });

    const result = await repository.getProgress(goalId, tenantId, 10000);

    expect(result.totalAmount).toBe(13000);
    expect(result.remainingAmount).toBe(0);
    expect(result.percentage).toBe(100);
  });

  it('retorna progresso zerado quando não existem movimentações', async () => {
    prisma.financialGoalContribution.aggregate.mockResolvedValue({
      _sum: { amount: null },
    });
    prisma.transfer.aggregate.mockResolvedValue({
      _sum: { amount: null },
    });

    const result = await repository.getProgress(goalId, tenantId, 10000);

    expect(result).toEqual({
      contributionsAmount: 0,
      transfersAmount: 0,
      totalAmount: 0,
      remainingAmount: 10000,
      percentage: 0,
    });
  });
});
