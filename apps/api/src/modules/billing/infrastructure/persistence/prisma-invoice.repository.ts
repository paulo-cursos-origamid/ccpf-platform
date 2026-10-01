import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InvoiceStatus as PrismaInvoiceStatus } from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { InvoiceEntity } from '../../domain/entities/invoice.entity';
import { InvoiceStatus } from '../../domain/enums/invoice-status.enum';
import {
  AdminInvoiceDetail,
  AdminInvoicePayment,
  AdminInvoicePlan,
  AdminInvoiceSubscription,
  AdminInvoiceTenant,
  FindAdminInvoicesOptions,
  FindAdminInvoicesResult,
  InvoiceRepository,
} from '../../domain/repositories/invoice.repository';

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
        status: InvoiceStatus[invoice.status],
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
        status: InvoiceStatus[invoice.status],
        dueAt: invoice.dueAt,
        paidAt: invoice.paidAt,
      },
    });

    return this.toDomain(updatedInvoice);
  }

  /**
   * Lista globalmente as Invoices destinadas ao painel administrativo.
   *
   * A consulta não utiliza tenantId e, portanto, não depende
   * do TenantContextGuard.
   */
  async findManyForAdmin(
    options: FindAdminInvoicesOptions,
  ): Promise<FindAdminInvoicesResult> {
    const skip = (options.page - 1) * options.limit;

    const search = options.search?.trim();

    const where = {
      ...(options.status
        ? {
            status: options.status,
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                number: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                tenant: {
                  name: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                tenant: {
                  slug: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: options.limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          subscription: {
            include: {
              plan: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  price: true,
                  currency: true,
                  billingInterval: true,
                },
              },
            },
          },
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            select: {
              id: true,
              reference: true,
              method: true,
              status: true,
              amount: true,
              currency: true,
              paidAt: true,
              expiresAt: true,
              provider: true,
              providerPaymentId: true,
              externalReference: true,
              pixCopyPaste: true,
              bankSlipBarcode: true,
              bankSlipDigitableLine: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      }),
      this.prisma.invoice.count({
        where,
      }),
    ]);

    return {
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        tenantId: invoice.tenantId,
        subscriptionId: invoice.subscriptionId,
        number: invoice.number,
        status: InvoiceStatus[invoice.status],
        amount: invoice.amount.toNumber(),
        currency: invoice.currency,
        dueAt: invoice.dueAt,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        tenant: this.toAdminTenant(invoice.tenant),
        subscription: this.toAdminSubscription(invoice.subscription),
        latestPayment: invoice.payments[0]
          ? this.toAdminPayment(invoice.payments[0])
          : null,
      })),
      total,
    };
  }

  /**
   * Consulta uma Invoice globalmente para o painel administrativo.
   *
   * O detalhe inclui Tenant, Subscription, Plan e todos os Payments.
   */
  async findAdminById(id: string): Promise<AdminInvoiceDetail | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: {
        id,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subscription: {
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                code: true,
                price: true,
                currency: true,
                billingInterval: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            reference: true,
            method: true,
            status: true,
            amount: true,
            currency: true,
            paidAt: true,
            expiresAt: true,
            provider: true,
            providerPaymentId: true,
            externalReference: true,
            pixCopyPaste: true,
            bankSlipBarcode: true,
            bankSlipDigitableLine: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!invoice) {
      return null;
    }

    return {
      id: invoice.id,
      tenantId: invoice.tenantId,
      subscriptionId: invoice.subscriptionId,
      number: invoice.number,
      status: InvoiceStatus[invoice.status],
      amount: invoice.amount.toNumber(),
      currency: invoice.currency,
      dueAt: invoice.dueAt,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      tenant: this.toAdminTenant(invoice.tenant),
      subscription: this.toAdminSubscription(invoice.subscription),
      payments: invoice.payments.map((payment) => this.toAdminPayment(payment)),
    };
  }

  /**
   * Mapeia os dados mínimos do Tenant utilizados pelo Admin Billing.
   */
  private toAdminTenant(tenant: {
    id: string;
    name: string;
    slug: string;
  }): AdminInvoiceTenant {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    };
  }

  /**
   * Mapeia a Subscription e o Plan para o contrato administrativo.
   */
  private toAdminSubscription(subscription: {
    id: string;
    status: string;
    startedAt: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    plan: {
      id: string;
      name: string;
      code: string;
      price: { toNumber(): number };
      currency: string;
      billingInterval: string;
    };
  }): AdminInvoiceSubscription {
    return {
      id: subscription.id,
      status: subscription.status as AdminInvoiceSubscription['status'],
      startedAt: subscription.startedAt,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        code: subscription.plan.code,
        price: subscription.plan.price.toNumber(),
        currency: subscription.plan.currency,
        billingInterval: subscription.plan
          .billingInterval as AdminInvoicePlan['billingInterval'],
      },
    };
  }

  /**
   * Mapeia Payment sem expor metadata persistido pelo provedor.
   */
  private toAdminPayment(payment: {
    id: string;
    reference: string;
    method: string;
    status: string;
    amount: { toNumber(): number };
    currency: string;
    paidAt: Date | null;
    expiresAt: Date | null;
    provider: string | null;
    providerPaymentId: string | null;
    externalReference: string | null;
    pixCopyPaste: string | null;
    bankSlipBarcode: string | null;
    bankSlipDigitableLine: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AdminInvoicePayment {
    return {
      id: payment.id,
      reference: payment.reference,
      method: payment.method as AdminInvoicePayment['method'],
      status: payment.status as AdminInvoicePayment['status'],
      amount: payment.amount.toNumber(),
      currency: payment.currency,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      externalReference: payment.externalReference,
      pixCopyPaste: payment.pixCopyPaste,
      bankSlipBarcode: payment.bankSlipBarcode,
      bankSlipDigitableLine: payment.bankSlipDigitableLine,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
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
