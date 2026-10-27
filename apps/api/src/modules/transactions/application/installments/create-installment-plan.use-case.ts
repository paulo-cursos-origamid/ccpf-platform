import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InstallmentStatus, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

export function calculateInstallmentDueDate(
  firstDueDate: Date,
  installmentIndex: number,
): Date {
  const year = firstDueDate.getUTCFullYear();
  const month = firstDueDate.getUTCMonth() + installmentIndex;
  const originalDay = firstDueDate.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const dueDate = new Date(firstDueDate);

  dueDate.setUTCDate(1);
  dueDate.setUTCFullYear(year);
  dueDate.setUTCMonth(month);
  dueDate.setUTCDate(Math.min(originalDay, lastDay));

  return dueDate;
}

export interface CreateInstallmentPlanInput {
  tenantId: string;
  userId: string;
  accountId: string;
  categoryId: string;
  subCategoryId?: string;
  title: string;
  totalAmount: string;
  purchaseDate: string;
  installmentCount: number;
  firstDueDate: string;
  description?: string;
}

@Injectable()
export class CreateInstallmentPlanUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: CreateInstallmentPlanInput) {
    const total = new Prisma.Decimal(input.totalAmount);

    if (!total.isFinite() || total.lte(0)) {
      throw new BadRequestException('O valor total deve ser maior que zero.');
    }

    if (
      !Number.isInteger(input.installmentCount) ||
      input.installmentCount < 2 ||
      input.installmentCount > 120
    ) {
      throw new BadRequestException('Informe de 2 a 120 parcelas.');
    }

    const purchaseDate = new Date(input.purchaseDate);
    const firstDueDate = new Date(input.firstDueDate);

    if (
      Number.isNaN(purchaseDate.getTime()) ||
      Number.isNaN(firstDueDate.getTime())
    ) {
      throw new BadRequestException('Informe datas válidas.');
    }

    const totalCents = total.mul(100);
    if (!totalCents.isInteger()) {
      throw new BadRequestException('O valor deve ter no máximo duas casas decimais.');
    }

    const totalCentsNumber = Number(totalCents.toFixed(0));
    const baseCents = Math.floor(totalCentsNumber / input.installmentCount);
    const remainder = totalCentsNumber - baseCents * input.installmentCount;

    if (!Number.isSafeInteger(totalCentsNumber) || baseCents < 1) {
      throw new BadRequestException(
        'O valor total é inválido para a quantidade de parcelas.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: {
          id: input.accountId,
          tenantId: input.tenantId,
          archivedAt: null,
        },
      });

      if (!account) {
        throw new NotFoundException('Conta não encontrada neste Espaço.');
      }

      const membership = await tx.accountMember.findFirst({
        where: {
          accountId: account.id,
          userId: input.userId,
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new ForbiddenException('Você não tem acesso a esta conta.');
      }

      const category = await tx.category.findFirst({
        where: {
          id: input.categoryId,
          tenantId: input.tenantId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada neste Espaço.');
      }

      if (category.type !== TransactionType.EXPENSE) {
        throw new BadRequestException(
          'A categoria deve ser do tipo despesa.',
        );
      }

      if (input.subCategoryId) {
        const subCategory = await tx.subCategory.findFirst({
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

      const plan = await tx.installmentPlan.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          accountId: account.id,
          categoryId: category.id,
          subCategoryId: input.subCategoryId ?? null,
          title: input.title.trim(),
          totalAmount: total,
          purchaseDate,
          installmentCount: input.installmentCount,
          firstDueDate,
          description: input.description?.trim() || null,
        },
      });

      await tx.installment.createMany({
        data: Array.from({ length: input.installmentCount }, (_, index) => {
          const dueDate = calculateInstallmentDueDate(firstDueDate, index);
          const cents =
            baseCents + (index === input.installmentCount - 1 ? remainder : 0);

          return {
            tenantId: input.tenantId,
            installmentPlanId: plan.id,
            installmentNumber: index + 1,
            amount: new Prisma.Decimal(cents).div(100),
            dueDate,
            status: InstallmentStatus.PENDING,
          };
        }),
      });

      return tx.installmentPlan.findFirstOrThrow({
        where: { id: plan.id, tenantId: input.tenantId },
        include: {
          installments: { orderBy: { installmentNumber: 'asc' } },
        },
      });
    });
  }
}
