import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoryType,
  Prisma,
  RecurringBillFrequency,
} from '@prisma/client';

import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface CreateRecurringBillInput {
  tenantId: string;
  userId: string;
  accountId: string;
  categoryId: string;
  subCategoryId?: string;
  title: string;
  expectedAmount?: string;
  frequency: RecurringBillFrequency;
  dueDay: number;
  startDate: string;
  endDate?: string;
  description?: string;
}

@Injectable()
export class CreateRecurringBillUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: CreateRecurringBillInput) {
    const title = input.title?.trim();

    if (!title) {
      throw new BadRequestException('Informe a descrição da conta.');
    }

    if (!Number.isInteger(input.dueDay) ||
        input.dueDay < 1 ||
        input.dueDay > 31) {
      throw new BadRequestException('Dia de vencimento inválido.');
    }

    if (!Object.values(RecurringBillFrequency).includes(input.frequency)) {
      throw new BadRequestException('Frequência inválida.');
    }

    const startDate = new Date(input.startDate);
    const endDate = input.endDate
      ? new Date(input.endDate)
      : null;

    if (Number.isNaN(startDate.getTime()) ||
        (endDate && Number.isNaN(endDate.getTime()))) {
      throw new BadRequestException('Data inválida.');
    }

    if (endDate && endDate < startDate) {
      throw new BadRequestException(
        'A data final não pode ser anterior à inicial.',
      );
    }

    let expectedAmount: Prisma.Decimal | null = null;

    if (input.expectedAmount !== undefined) {
      if (!/^(?=.*[1-9])\d+(?:\.\d{1,2})?$/.test(input.expectedAmount)) {
        throw new BadRequestException('Valor previsto inválido.');
      }

      expectedAmount = new Prisma.Decimal(input.expectedAmount);

      if (!expectedAmount.isFinite() || expectedAmount.lte(0)) {
        throw new BadRequestException('Valor previsto inválido.');
      }
    }

    const account = await this.prisma.account.findFirst({
      where: {
        id: input.accountId,
        tenantId: input.tenantId,
        archivedAt: null,
      },
    });

    if (!account) {
      throw new NotFoundException('Conta não encontrada neste Espaço.');
    }

    const membership = await this.prisma.accountMember.findFirst({
      where: {
        accountId: account.id,
        userId: input.userId,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      throw new ForbiddenException('Você não tem acesso a esta conta.');
    }

    if (membership.role === 'VIEWER') {
      throw new ForbiddenException(
        'Você não tem permissão para cadastrar contas recorrentes.',
      );
    }

    const category = await this.prisma.category.findFirst({
      where: {
        id: input.categoryId,
        tenantId: input.tenantId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada neste Espaço.');
    }

    if (category.type !== CategoryType.EXPENSE) {
      throw new BadRequestException(
        'Contas recorrentes devem utilizar categorias de despesa.',
      );
    }

    if (input.subCategoryId) {
      const subCategory = await this.prisma.subCategory.findFirst({
        where: {
          id: input.subCategoryId,
          categoryId: category.id,
          deletedAt: null,
        },
      });

      if (!subCategory) {
        throw new NotFoundException(
          'Subcategoria não encontrada nesta categoria.',
        );
      }
    }

    return this.prisma.recurringBill.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        accountId: account.id,
        categoryId: category.id,
        subCategoryId: input.subCategoryId ?? null,
        title,
        expectedAmount,
        frequency: input.frequency,
        dueDay: input.dueDay,
        startDate,
        endDate,
        description: input.description?.trim() || null,
      },
    });
  }
}
