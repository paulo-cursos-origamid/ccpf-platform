import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InvoiceStatus as PrismaInvoiceStatus } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { InvoiceEntity } from '../../domain/entities/invoice.entity';
import { InvoiceStatus } from '../../domain/enums/invoice-status.enum';
import { InvoiceRepository } from '../../domain/repositories/invoice.repository';

/**
 * Implementação Prisma do repositório de Invoice.
 *
 * Responsável por traduzir os registros persistidos pelo Prisma
 * para entidades pertencentes ao domínio de Billing.
 *
 * O domínio não conhece Prisma nem os enums gerados pelo ORM.
 */
@Injectable()
export class PrismaInvoiceRepository implements InvoiceRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async create(invoice: InvoiceEntity): Promise<InvoiceEntity> {
    const createdInvoice = await this.prisma.invoice.create({
      data: {
        id: invoice.id,
        tenantId: invoice.tenantId,
        subscriptionId: invoice.subscriptionId,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount,
        currency: invoice.currency,
        dueAt: invoice.dueAt,
        paidAt: invoice.paidAt,
      },
    });

    return this.toDomain(createdInvoice);
  }

  async findById(id: string): Promise<InvoiceEntity | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return null;
    }

    return this.toDomain(invoice);
  }

  async findByNumber(number: string): Promise<InvoiceEntity | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { number },
    });

    if (!invoice) {
      return null;
    }

    return this.toDomain(invoice);
  }

  async findByTenant(tenantId: string): Promise<InvoiceEntity[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invoices.map((invoice) => this.toDomain(invoice));
  }

  async findBySubscription(subscriptionId: string): Promise<InvoiceEntity[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        subscriptionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invoices.map((invoice) => this.toDomain(invoice));
  }

  async update(invoice: InvoiceEntity): Promise<InvoiceEntity> {
    const updatedInvoice = await this.prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        status: invoice.status,
        dueAt: invoice.dueAt,
        paidAt: invoice.paidAt,
      },
    });

    return this.toDomain(updatedInvoice);
  }

  /**
   * Converte um registro Prisma em uma entidade do domínio.
   */
  private toDomain(rawInvoice: {
    id: string;
    tenantId: string;
    subscriptionId: string;
    number: string;
    status: PrismaInvoiceStatus;
    amount: { toNumber(): number };
    currency: string;
    dueAt: Date;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): InvoiceEntity {
    return new InvoiceEntity(
      rawInvoice.id,
      rawInvoice.tenantId,
      rawInvoice.subscriptionId,
      rawInvoice.number,
      rawInvoice.status as InvoiceStatus,
      rawInvoice.amount.toNumber(),
      rawInvoice.currency,
      rawInvoice.dueAt,
      rawInvoice.paidAt,
      rawInvoice.createdAt,
      rawInvoice.updatedAt,
    );
  }
}
