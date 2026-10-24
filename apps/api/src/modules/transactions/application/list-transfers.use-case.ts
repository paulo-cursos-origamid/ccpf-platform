import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ListTransfersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(tenantId: string, userId: string) {
    return this.prisma.transfer.findMany({
      where: {
        tenantId,
        deletedAt: null,
        fromAccount: {
          archivedAt: null,
          accountMembers: {
            some: { userId, status: 'ACTIVE' },
          },
        },
        toAccount: {
          archivedAt: null,
          accountMembers: {
            some: { userId, status: 'ACTIVE' },
          },
        },
      },
      include: {
        fromAccount: { select: { id: true, name: true, currency: true } },
        toAccount: { select: { id: true, name: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
