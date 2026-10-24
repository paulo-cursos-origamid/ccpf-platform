import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class GetTransactionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string, userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        tenantId,
        userId,
        deletedAt: null,
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
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada.');
    }

    return transaction;
  }
}
