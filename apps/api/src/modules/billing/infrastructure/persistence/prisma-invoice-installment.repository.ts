import { Prisma } from '@prisma/client';
import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { InvoiceInstallmentEntity } from '../../domain/entities/invoice-installment.entity';
import { InvoiceInstallmentStatus } from '../../domain/enums/invoice-installment-status.enum';
import { InvoiceInstallmentRepository } from '../../domain/repositories/invoice-installment.repository';

@Injectable()
export class PrismaInvoiceInstallmentRepository implements InvoiceInstallmentRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async create(
    installment: InvoiceInstallmentEntity,
  ): Promise<InvoiceInstallmentEntity> {
    const created = await this.prisma.invoiceInstallment.create({
      data: {
        id: installment.id,
        invoiceId: installment.invoiceId,
        number: installment.number,
        totalCount: installment.totalCount,
        amount: installment.amount,
        currency: installment.currency,
        dueAt: installment.dueAt,
        paidAt: installment.paidAt,
        status: installment.status,
        createdAt: installment.createdAt,
        updatedAt: installment.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async createMany(
    installments: InvoiceInstallmentEntity[],
  ): Promise<InvoiceInstallmentEntity[]> {
    if (installments.length === 0) {
      return [];
    }

    await this.prisma.invoiceInstallment.createMany({
      data: installments.map((installment) => ({
        id: installment.id,
        invoiceId: installment.invoiceId,
        number: installment.number,
        totalCount: installment.totalCount,
        amount: installment.amount,
        currency: installment.currency,
        dueAt: installment.dueAt,
        paidAt: installment.paidAt,
        status: installment.status,
        createdAt: installment.createdAt,
        updatedAt: installment.updatedAt,
      })),
    });

    return this.findByInvoice(installments[0].invoiceId);
  }

  async findById(id: string): Promise<InvoiceInstallmentEntity | null> {
    const installment = await this.prisma.invoiceInstallment.findUnique({
      where: { id },
    });

    return installment ? this.toDomain(installment) : null;
  }

  async findByInvoice(invoiceId: string): Promise<InvoiceInstallmentEntity[]> {
    const installments = await this.prisma.invoiceInstallment.findMany({
      where: { invoiceId },
      orderBy: { number: 'asc' },
    });

    return installments.map((installment) => this.toDomain(installment));
  }

  async update(
    installment: InvoiceInstallmentEntity,
  ): Promise<InvoiceInstallmentEntity> {
    const updated = await this.prisma.invoiceInstallment.update({
      where: { id: installment.id },
      data: {
        status: installment.status,
        paidAt: installment.paidAt,
        updatedAt: installment.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  private toDomain(raw: {
    id: string;
    invoiceId: string;
    number: number;
    totalCount: number;
    amount: unknown;
    currency: string;
    dueAt: Date;
    paidAt: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): InvoiceInstallmentEntity {
    return new InvoiceInstallmentEntity(
      raw.id,
      raw.invoiceId,
      raw.number,
      raw.totalCount,
      Number(raw.amount),
      raw.currency,
      raw.dueAt,
      raw.status as InvoiceInstallmentStatus,
      raw.paidAt,
      raw.createdAt,
      raw.updatedAt,
    );
  }
}
