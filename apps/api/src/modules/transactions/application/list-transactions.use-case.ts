import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class ListTransactionsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(tenantId: string, userId: string, type?: TransactionType) {
    return this.prisma.transaction.findMany({
      where: {
        tenantId,
        userId,
        deletedAt: null,
        ...(type ? { type } : {}),
        account: {
          accountMembers: {
            some: { userId, status: 'ACTIVE' },
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
  }
}
