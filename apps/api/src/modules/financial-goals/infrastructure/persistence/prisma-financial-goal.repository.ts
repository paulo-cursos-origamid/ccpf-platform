import { Injectable } from '@nestjs/common';
import { FinancialGoalStatus as PrismaFinancialGoalStatus } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { FinancialGoalEntity } from '../../domain/entities/financial-goal.entity';
import { FinancialGoalContributionEntity } from '../../domain/entities/financial-goal-contribution.entity';
import { FinancialGoalStatus } from '../../domain/enums/financial-goal-status.enum';
import {
  FinancialGoalProgress,
  FinancialGoalRepository,
} from '../../domain/repositories/financial-goal.repository';

@Injectable()
export class PrismaFinancialGoalRepository implements FinancialGoalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(goal: FinancialGoalEntity): Promise<FinancialGoalEntity> {
    const created = await this.prisma.financialGoal.create({
      data: {
        id: goal.id,
        tenantId: goal.tenantId,
        userId: goal.userId,
        name: goal.name,
        description: goal.description,
        linkedAccountId: goal.linkedAccountId,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate,
        status: goal.status,
      },
    });

    return this.toGoalDomain(created);
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<FinancialGoalEntity | null> {
    const goal = await this.prisma.financialGoal.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    return goal ? this.toGoalDomain(goal) : null;
  }

  async findMany(tenantId: string): Promise<FinancialGoalEntity[]> {
    const goals = await this.prisma.financialGoal.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((goal) => this.toGoalDomain(goal));
  }

  async update(
    goal: FinancialGoalEntity,
    tenantId: string,
  ): Promise<FinancialGoalEntity> {
    const updated = await this.prisma.financialGoal.updateMany({
      where: {
        id: goal.id,
        tenantId,
        deletedAt: null,
      },
      data: {
        name: goal.name,
        description: goal.description,
        linkedAccountId: goal.linkedAccountId,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate,
        status: goal.status,
        deletedAt: goal.deletedAt,
      },
    });

    if (updated.count !== 1) {
      throw new Error('Financial goal not found in the specified Tenant');
    }

    const persisted = await this.prisma.financialGoal.findFirst({
      where: {
        id: goal.id,
        tenantId,
        deletedAt: goal.deletedAt,
      },
    });

    if (!persisted) {
      throw new Error('Financial goal not found after update');
    }

    return this.toGoalDomain(persisted);
  }

  async createContribution(
    contribution: FinancialGoalContributionEntity,
  ): Promise<FinancialGoalContributionEntity> {
    const created = await this.prisma.financialGoalContribution.create({
      data: {
        id: contribution.id,
        tenantId: contribution.tenantId,
        goalId: contribution.goalId,
        userId: contribution.userId,
        amount: contribution.amount,
        date: contribution.date,
        description: contribution.description,
      },
    });

    return this.toContributionDomain(created);
  }

  async listContributions(
    goalId: string,
    tenantId: string,
  ): Promise<FinancialGoalContributionEntity[]> {
    const contributions = await this.prisma.financialGoalContribution.findMany({
      where: {
        goalId,
        tenantId,
        deletedAt: null,
      },
      orderBy: { date: 'desc' },
    });

    return contributions.map((item) => this.toContributionDomain(item));
  }

  async softDeleteContribution(
    contributionId: string,
    goalId: string,
    tenantId: string,
  ): Promise<boolean> {
    const result = await this.prisma.financialGoalContribution.updateMany({
      where: {
        id: contributionId,
        goalId,
        tenantId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return result.count === 1;
  }

  async getProgress(
    goalId: string,
    tenantId: string,
    targetAmount: number,
  ): Promise<FinancialGoalProgress> {
    const [contributions, transfers] = await Promise.all([
      this.prisma.financialGoalContribution.aggregate({
        where: {
          goalId,
          tenantId,
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
      this.prisma.transfer.aggregate({
        where: {
          financialGoalId: goalId,
          tenantId,
          deletedAt: null,
        },
        _sum: { amount: true },
      }),
    ]);

    const contributionsAmount = Number(contributions._sum.amount ?? 0);
    const transfersAmount = Number(transfers._sum.amount ?? 0);
    const totalAmount = contributionsAmount + transfersAmount;
    const remainingAmount = Math.max(targetAmount - totalAmount, 0);
    const percentage =
      targetAmount > 0 ? Math.min((totalAmount / targetAmount) * 100, 100) : 0;

    return {
      contributionsAmount,
      transfersAmount,
      totalAmount,
      remainingAmount,
      percentage,
    };
  }

  private toGoalDomain(raw: {
    id: string;
    tenantId: string;
    userId: string;
    name: string;
    description: string | null;
    linkedAccountId: string | null;
    targetAmount: unknown;
    targetDate: Date | null;
    status: PrismaFinancialGoalStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): FinancialGoalEntity {
    return new FinancialGoalEntity({
      id: raw.id,
      tenantId: raw.tenantId,
      userId: raw.userId,
      name: raw.name,
      description: raw.description,
      linkedAccountId: raw.linkedAccountId,
      targetAmount: Number(raw.targetAmount),
      targetDate: raw.targetDate,
      status: raw.status as FinancialGoalStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  private toContributionDomain(raw: {
    id: string;
    tenantId: string;
    goalId: string;
    userId: string;
    amount: unknown;
    date: Date;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): FinancialGoalContributionEntity {
    return new FinancialGoalContributionEntity({
      id: raw.id,
      tenantId: raw.tenantId,
      goalId: raw.goalId,
      userId: raw.userId,
      amount: Number(raw.amount),
      date: raw.date,
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }
}
