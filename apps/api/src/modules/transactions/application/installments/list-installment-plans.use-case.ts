import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class ListInstallmentPlansUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute(tenantId: string) {
    return this.prisma.installmentPlan.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
      orderBy: [{ purchaseDate: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
