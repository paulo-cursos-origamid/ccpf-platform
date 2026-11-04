/**
 * Implementação Prisma do read model do dashboard administrativo.
 *
 * Responsabilidade:
 * - Executar consultas agregadas diretamente no banco.
 * - Executar somente as consultas permitidas pelo escopo recebido.
 * - Evitar N+1 queries.
 * - Transformar os agrupamentos do Prisma no contrato do dashboard.
 *
 * Não contém regras de autorização.
 * A autorização já foi resolvida pelo caso de uso.
 */

import { Injectable } from '@nestjs/common';
import {
  InvoiceInstallmentStatus,
  InvoiceStatus,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
  TenantStatus,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import {
  AdminDashboardBillingMetric,
  AdminDashboardRepository,
  AdminDashboardScope,
  AdminDashboardSummary,
} from '../../domain/repositories/admin-dashboard.repository';

@Injectable()
export class PrismaAdminDashboardRepository implements AdminDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(scope: AdminDashboardScope): Promise<AdminDashboardSummary> {
    const now = new Date();
    const currentMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const previousMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const usersPromise = scope.users
      ? Promise.all([
          this.prisma.user.count({
            where: {
              deletedAt: null,
            },
          }),

          this.prisma.user.count({
            where: {
              deletedAt: null,
              isActive: true,
            },
          }),

          this.prisma.user.count({
            where: {
              deletedAt: null,
              isActive: false,
            },
          }),
          this.prisma.user.count({
            where: {
              deletedAt: null,
              createdAt: { gte: currentMonthStart, lt: nextMonthStart },
            },
          }),
          this.prisma.user.count({
            where: {
              deletedAt: null,
              createdAt: { gte: previousMonthStart, lt: currentMonthStart },
            },
          }),
        ])
      : null;

    const tenantsPromise = scope.tenants
      ? Promise.all([
          this.prisma.tenant.groupBy({
            by: ['status'],
            _count: {
              _all: true,
            },
          }),
          this.prisma.tenant.count({
            where: {
              createdAt: { gte: currentMonthStart, lt: nextMonthStart },
            },
          }),
          this.prisma.tenant.count({
            where: {
              createdAt: { gte: previousMonthStart, lt: currentMonthStart },
            },
          }),
        ])
      : null;

    const subscriptionsPromise = scope.subscriptions
      ? Promise.all([
          this.prisma.subscription.groupBy({
            by: ['status'],
            _count: {
              _all: true,
            },
          }),
          this.prisma.subscription.count({
            where: {
              createdAt: { gte: currentMonthStart, lt: nextMonthStart },
            },
          }),
          this.prisma.subscription.count({
            where: {
              createdAt: { gte: previousMonthStart, lt: currentMonthStart },
            },
          }),
        ])
      : null;

    const billingPromise = scope.billing
      ? Promise.all([
          // Mantém a contagem e o valor nominal das faturas por status.
          this.prisma.invoice.groupBy({
            by: ['status'],
            where: {
              status: {
                in: [
                  InvoiceStatus.PAID,
                  InvoiceStatus.PENDING,
                  InvoiceStatus.OVERDUE,
                ],
              },
            },
            _count: {
              _all: true,
            },
            _sum: {
              amount: true,
            },
          }),

          // Receita realizada: somente tentativas de pagamento confirmadas.
          this.prisma.payment.aggregate({
            where: {
              status: PaymentStatus.PAID,
            },
            _count: {
              _all: true,
            },
            _sum: {
              amount: true,
            },
          }),
          this.prisma.payment.aggregate({
            where: {
              status: PaymentStatus.PAID,
              paidAt: { gte: currentMonthStart, lt: nextMonthStart },
            },
            _count: { _all: true },
            _sum: { amount: true },
          }),
          this.prisma.payment.aggregate({
            where: {
              status: PaymentStatus.PAID,
              paidAt: { gte: previousMonthStart, lt: currentMonthStart },
            },
            _count: { _all: true },
            _sum: { amount: true },
          }),

          // Saldo em aberto/vencido é calculado por parcela, não por tentativa.
          this.prisma.invoiceInstallment.groupBy({
            by: ['status'],
            where: {
              status: {
                in: [
                  InvoiceInstallmentStatus.PENDING,
                  InvoiceInstallmentStatus.OVERDUE,
                ],
              },
            },
            _count: {
              _all: true,
            },
            _sum: {
              amount: true,
            },
          }),
        ])
      : null;

    const [usersResult, tenantsResult, subscriptionsResult, billingResult] =
      await Promise.all([
        usersPromise,
        tenantsPromise,
        subscriptionsPromise,
        billingPromise,
      ]);

    const [tenantGroups, tenantsCurrent, tenantsPrevious] = tenantsResult ?? [
      null,
      null,
      null,
    ];
    const [subscriptionGroups, subscriptionsCurrent, subscriptionsPrevious] =
      subscriptionsResult ?? [null, null, null];
    const [
      invoiceGroups,
      receivedAggregate,
      receivedCurrent,
      receivedPrevious,
      installmentGroups,
    ] = billingResult ?? [null, null, null, null, null];

    const summary: AdminDashboardSummary = {};
    const monthOverMonth: NonNullable<AdminDashboardSummary['monthOverMonth']> =
      {};

    if (usersResult) {
      const [
        usersTotal,
        usersActive,
        usersInactive,
        usersCurrent,
        usersPrevious,
      ] = usersResult;

      summary.users = {
        total: usersTotal,
        active: usersActive,
        inactive: usersInactive,
      };
      monthOverMonth.users = { current: usersCurrent, previous: usersPrevious };
    }

    if (tenantGroups) {
      const tenantCounts = this.toTenantCounts(tenantGroups);

      summary.tenants = {
        total:
          tenantCounts.active + tenantCounts.suspended + tenantCounts.cancelled,
        active: tenantCounts.active,
        suspended: tenantCounts.suspended,
        cancelled: tenantCounts.cancelled,
      };
      monthOverMonth.tenants = {
        current: tenantsCurrent ?? 0,
        previous: tenantsPrevious ?? 0,
      };
    }

    if (subscriptionGroups) {
      const subscriptionCounts = this.toSubscriptionCounts(subscriptionGroups);

      summary.subscriptions = {
        total:
          subscriptionCounts.pending +
          subscriptionCounts.trialing +
          subscriptionCounts.active +
          subscriptionCounts.pastDue +
          subscriptionCounts.suspended +
          subscriptionCounts.cancelled +
          subscriptionCounts.expired,
        pending: subscriptionCounts.pending,
        trialing: subscriptionCounts.trialing,
        active: subscriptionCounts.active,
        pastDue: subscriptionCounts.pastDue,
        suspended: subscriptionCounts.suspended,
        cancelled: subscriptionCounts.cancelled,
        expired: subscriptionCounts.expired,
      };
      monthOverMonth.subscriptions = {
        current: subscriptionsCurrent ?? 0,
        previous: subscriptionsPrevious ?? 0,
      };
    }

    if (invoiceGroups) {
      const paid = this.toBillingMetric(
        invoiceGroups.find((group) => group.status === InvoiceStatus.PAID),
      );

      const pending = this.toBillingMetric(
        installmentGroups?.find(
          (group) => group.status === InvoiceInstallmentStatus.PENDING,
        ),
      );

      const overdue = this.toBillingMetric(
        installmentGroups?.find(
          (group) => group.status === InvoiceInstallmentStatus.OVERDUE,
        ),
      );

      summary.billing = {
        paid,
        received: {
          count: receivedAggregate?._count._all ?? 0,
          amount: receivedAggregate?._sum.amount
            ? Number(receivedAggregate._sum.amount)
            : 0,
        },
        pending,
        overdue,
      };
      monthOverMonth.received = {
        current: this.toBillingMetric(receivedCurrent),
        previous: this.toBillingMetric(receivedPrevious),
      };
    }

    if (Object.keys(monthOverMonth).length > 0) {
      summary.monthOverMonth = monthOverMonth;
    }

    return summary;
  }

  private toTenantCounts(
    groups: Array<{
      status: TenantStatus;
      _count: {
        _all: number;
      };
    }>,
  ) {
    return {
      active: this.findCount(groups, TenantStatus.ACTIVE),
      suspended: this.findCount(groups, TenantStatus.SUSPENDED),
      cancelled: this.findCount(groups, TenantStatus.CANCELLED),
    };
  }

  private toSubscriptionCounts(
    groups: Array<{
      status: SubscriptionStatus;
      _count: {
        _all: number;
      };
    }>,
  ) {
    return {
      pending: this.findCount(groups, SubscriptionStatus.PENDING),
      trialing: this.findCount(groups, SubscriptionStatus.TRIALING),
      active: this.findCount(groups, SubscriptionStatus.ACTIVE),
      pastDue: this.findCount(groups, SubscriptionStatus.PAST_DUE),
      suspended: this.findCount(groups, SubscriptionStatus.SUSPENDED),
      cancelled: this.findCount(groups, SubscriptionStatus.CANCELLED),
      expired: this.findCount(groups, SubscriptionStatus.EXPIRED),
    };
  }

  private findCount<T extends string>(
    groups: Array<{
      status: T;
      _count: {
        _all: number;
      };
    }>,
    status: T,
  ): number {
    return groups.find((group) => group.status === status)?._count._all ?? 0;
  }

  private toBillingMetric(
    group:
      | {
          _count: {
            _all: number;
          };
          _sum: {
            amount: Prisma.Decimal | null;
          };
        }
      | undefined,
  ): AdminDashboardBillingMetric {
    return {
      count: group?._count._all ?? 0,
      amount: group?._sum.amount ? Number(group._sum.amount) : 0,
    };
  }
}
