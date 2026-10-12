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
        installmentCount: invoice.installmentCount,
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
    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        // Os enums do domínio e do Prisma usam os mesmos valores textuais.
        // Persistimos o status diretamente para evitar conversões ambíguas.
        status: invoice.status,
        dueAt: invoice.dueAt,
        paidAt: invoice.paidAt,
        updatedAt: invoice.updatedAt,
      },
    });

    return this.toDomain(updated);
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
                },
              },
              planPrice: {
                select: {
                  id: true,
                  amount: true,
                  currency: true,
                  interval: true,
                },
              },
            },
          },
          installments: {
            orderBy: {
              number: 'asc',
            },
            include: {
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
        installmentCount: invoice.installmentCount,
        amount: invoice.amount.toNumber(),
        currency: invoice.currency,
        dueAt: invoice.dueAt,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        tenant: this.toAdminTenant(invoice.tenant),
        subscription: this.toAdminSubscription(invoice.subscription),
        installments: invoice.installments.map((installment) => ({
          id: installment.id,
          number: installment.number,
          totalCount: installment.totalCount,
          amount: installment.amount.toNumber(),
          currency: installment.currency,
          dueAt: installment.dueAt,
          paidAt: installment.paidAt,
          status: installment.status as InvoiceStatus,
          payments: installment.payments.map((payment) =>
            this.toAdminPayment(payment),
          ),
        })),
        latestPayment: this.findLatestAdminPayment(invoice.installments),
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
              },
            },
            planPrice: {
              select: {
                id: true,
                amount: true,
                currency: true,
                interval: true,
              },
            },
          },
        },
        installments: {
          orderBy: {
            number: 'asc',
          },
          include: {
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
      installmentCount: invoice.installmentCount,
      amount: invoice.amount.toNumber(),
      currency: invoice.currency,
      dueAt: invoice.dueAt,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      tenant: this.toAdminTenant(invoice.tenant),
      subscription: this.toAdminSubscription(invoice.subscription),
      installments: invoice.installments.map((installment) => ({
        id: installment.id,
        number: installment.number,
        totalCount: installment.totalCount,
        amount: installment.amount.toNumber(),
        currency: installment.currency,
        dueAt: installment.dueAt,
        paidAt: installment.paidAt,
        status: installment.status as InvoiceStatus,
        payments: installment.payments.map((payment) =>
          this.toAdminPayment(payment),
        ),
      })),
      latestPayment: this.findLatestAdminPayment(invoice.installments),
      payments: invoice.installments.flatMap((installment) =>
        installment.payments.map((payment) => this.toAdminPayment(payment)),
      ),
    };
  }

  /**
   * Obtém o pagamento mais recente considerando todas as parcelas.
   *
   * O pagamento pertence à parcela; este método existe apenas para
   * preservar o contrato legado utilizado pela listagem administrativa.
   */
  private findLatestAdminPayment(
    installments: Array<{
      payments: Array<{
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
      }>;
    }>,
  ): AdminInvoicePayment | null {
    const payments = installments
      .flatMap((installment) => installment.payments)
      .sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
      );

    return payments[0] ? this.toAdminPayment(payments[0]) : null;
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
    };
    planPrice: {
      id: string;
      amount: { toNumber(): number };
      currency: string;
      interval: string;
    } | null;
  }): AdminInvoiceSubscription {
    if (!subscription.planPrice) {
      throw new Error(
        `Invoice subscription ${subscription.id} does not have a PlanPrice.`,
      );
    }

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
        planPriceId: subscription.planPrice.id,
        price: subscription.planPrice.amount.toNumber(),
        currency: subscription.planPrice.currency,
        billingInterval: subscription.planPrice
          .interval as AdminInvoicePlan['billingInterval'],
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
    installmentCount: number;
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
      rawInvoice.installmentCount,
    );
  }
}
