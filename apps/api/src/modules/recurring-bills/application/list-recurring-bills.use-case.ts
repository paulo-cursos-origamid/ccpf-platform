import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class ListRecurringBillsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string, userId: string) {
    const bills = await this.prisma.recurringBill.findMany({
      where: {
        tenantId,
        account: {
          archivedAt: null,
          accountMembers: {
            some: {
              userId,
              status: 'ACTIVE',
            },
          },
        },
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        occurrences: {
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { dueDay: 'asc' },
        { title: 'asc' },
      ],
    });

    return bills.map((bill) => ({
      ...bill,
      expectedAmount: bill.expectedAmount?.toString() ?? null,
      occurrences: bill.occurrences.map((occurrence) => ({
        ...occurrence,
        expectedAmount: occurrence.expectedAmount?.toString() ?? null,
        paidAmount: occurrence.paidAmount?.toString() ?? null,
      })),
    }));
  }
}
