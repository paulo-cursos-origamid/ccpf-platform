import { Injectable } from '@nestjs/common';
import {
  InvoiceStatus as PrismaInvoiceStatus,
  SubscriptionStatus as PrismaSubscriptionStatus,
  TenantMemberStatus as PrismaTenantMemberStatus,
  TenantRole as PrismaTenantRole,
  TenantStatus as PrismaTenantStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { UserEntity, UserRole } from '../../domain/entities/user.entity';
import {
  PublicPlanData,
  PublicUserProvisioningRepository,
} from '../../domain/repositories/public-user-provisioning.repository';

import { TenantMemberEntity } from '../../../tenant/domain/entities/tenant-member.entity';
import { TenantEntity } from '../../../tenant/domain/entities/tenant.entity';
import { TenantMemberStatus } from '../../../tenant/domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../tenant/domain/enums/tenant-role.enum';
import { TenantStatus } from '../../../tenant/domain/enums/tenant-status.enum';

import { InvoiceInstallmentEntity } from '../../../billing/domain/entities/invoice-installment.entity';
import { InvoiceEntity } from '../../../billing/domain/entities/invoice.entity';
import { InvoiceStatus } from '../../../billing/domain/enums/invoice-status.enum';
import { SubscriptionEntity } from '../../../billing/domain/entities/subscription.entity';
import { SubscriptionStatus } from '../../../billing/domain/enums/subscription-status.enum';
import { BillingInterval } from '../../../billing/domain/enums/billing-interval.enum';

/**
 * Implementação Prisma responsável pelo provisionamento atômico
 * de um novo cliente SaaS.
 *
 * Uma única transação cria:
 *
 * 1. User;
 * 2. Tenant;
 * 3. TenantMember OWNER;
 * 4. Subscription;
 * 5. Invoice, quando o plano contratado for pago.
 *
 * Se qualquer operação falhar, todas as operações são revertidas.
 */
@Injectable()
export class PrismaPublicUserProvisioningRepository implements PublicUserProvisioningRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca um plano disponível para contratação pública.
   *
   * O código recebido do cadastro é validado contra o catálogo real
   * do banco. Portanto, o cliente nunca define preço, moeda ou status
   * da assinatura.
   */
  async findPublicPlan(planCode: string): Promise<PublicPlanData | null> {
    const plan = await this.prisma.plan.findUnique({
      where: {
        code: planCode,
      },
      select: {
        id: true,
        code: true,
        name: true,
        isPublic: true,
        isActive: true,
        prices: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            interval: true,
            amount: true,
            currency: true,
          },
        },
      },
    });

    if (!plan || !plan.isPublic || !plan.isActive) {
      return null;
    }

    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      prices: plan.prices.map((price) => ({
        id: price.id,
        interval: price.interval as unknown as BillingInterval,
        amount: price.amount.toNumber(),
        currency: price.currency,
      })),
    };
  }

  /**
   * Persiste todo o contexto inicial do cliente em uma única
   * transação PostgreSQL.
   */
  async create(
    user: UserEntity,
    tenant: TenantEntity,
    owner: TenantMemberEntity,
    subscription: SubscriptionEntity,
    invoice: InvoiceEntity | null,
    installments: InvoiceInstallmentEntity[],
  ): Promise<{
    user: UserEntity;
    tenant: TenantEntity;
    owner: TenantMemberEntity;
    subscription: SubscriptionEntity;
    invoice: InvoiceEntity | null;
    installments: InvoiceInstallmentEntity[];
  }> {
    return this.prisma.$transaction(async (tx) => {
      /**
       * O plano é consultado novamente dentro da transação.
       *
       * A Subscription já carrega o ID do plano validado pelo caso
       * de uso. O novo lookup garante que a persistência efetiva
       * continue protegida pelas regras de disponibilidade do plano.
       */
      const transactionalPlan = await tx.plan.findUnique({
        where: {
          id: subscription.planId,
        },
      });

      if (!transactionalPlan) {
        throw new Error('Plano selecionado não encontrado.');
      }

      if (!transactionalPlan.isPublic || !transactionalPlan.isActive) {
        throw new Error(
          'Plano selecionado não está disponível para cadastro público.',
        );
      }

      if (invoice && invoice.subscriptionId !== subscription.id) {
        throw new Error(
          'A Invoice inicial não está vinculada à assinatura selecionada.',
        );
      }

      if (invoice && subscription.status !== SubscriptionStatus.PENDING) {
        throw new Error(
          'A assinatura de um plano pago deve iniciar como PENDING.',
        );
      }

      if (!invoice && subscription.status !== SubscriptionStatus.TRIALING) {
        throw new Error(
          'A assinatura do plano TRIAL deve iniciar como TRIALING.',
        );
      }

      const createdUser = await tx.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          verificationToken: user.verificationToken,
          verificationTokenExpiresAt: user.verificationTokenExpiresAt,
          refreshTokenHash: user.refreshTokenHash,
          passwordResetToken: user.passwordResetToken,
          passwordResetExpiresAt: user.passwordResetExpiresAt,
          lastLoginAt: user.lastLoginAt,
          deletedAt: user.deletedAt,
        },
      });

      const billingAccount = await tx.billingAccount.create({
        data: {
          name: createdUser.name,
          ownerUserId: createdUser.id,
        },
      });

      const createdTenant = await tx.tenant.create({
        data: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          billingAccountId: billingAccount.id,
          status: tenant.status,
          nameConfirmed: tenant.nameConfirmed,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        },
      });

      const createdOwner = await tx.tenantMember.create({
        data: {
          id: owner.id,
          tenantId: owner.tenantId,
          userId: owner.userId,
          role: owner.role,
          status: owner.status,
          createdAt: owner.createdAt,
          updatedAt: owner.updatedAt,
        },
      });

      // Provisiona categorias e subcategorias padrão para o tenant inicial.
      const categoryTemplates = await tx.categoryTemplate.findMany({
        include: {
          domains: true,
          subCategories: true,
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      });

      for (const template of categoryTemplates) {
        const category = await tx.category.create({
          data: {
            tenantId: createdTenant.id,
            name: template.name,
            slug: template.slug,
            type: template.type,
            description: template.description,
            color: template.color,
            icon: template.icon,
            isVehicleCategory: template.isVehicleCategory,
            templateId: template.id,
            domains: {
              create: template.domains.map(({ domain }) => ({ domain })),
            },
            subCategories: {
              create: template.subCategories.map((subTemplate) => ({
                name: subTemplate.name,
                slug: subTemplate.slug,
                description: subTemplate.description,
                color: subTemplate.color,
                icon: subTemplate.icon,
                templateId: subTemplate.id,
              })),
            },
          },
        });
      }

      const createdSubscription = await tx.subscription.create({
        data: {
          id: subscription.id,
          tenantId: subscription.tenantId,
          billingAccountId: billingAccount.id,
          planId: transactionalPlan.id,
          planPriceId: subscription.planPriceId,
          pendingPlanId: subscription.pendingPlanId,
          pendingPlanPriceId: subscription.pendingPlanPriceId,
          pendingPlanChangeType: subscription.pendingPlanChangeType,
          pendingPlanEffectiveAt: subscription.pendingPlanEffectiveAt,
          pendingPlanInvoiceId: subscription.pendingPlanInvoiceId,
          status: subscription.status,
          startedAt: subscription.startedAt,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          billingDay: subscription.billingDay,
          nextBillingDate: subscription.nextBillingDate,
          trialEndsAt: subscription.trialEndsAt,
          cancelledAt: subscription.cancelledAt,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        },
      });

      let createdInvoice: InvoiceEntity | null = null;

      if (invoice) {
        const persistedInvoice = await tx.invoice.create({
          data: {
            id: invoice.id,
            tenantId: invoice.tenantId,
            subscriptionId: invoice.subscriptionId,
            number: invoice.number,
            status: invoice.status,
            installmentCount: invoice.installmentCount,
            amount: invoice.amount,
            currency: invoice.currency,
            dueAt: invoice.dueAt,
            paidAt: invoice.paidAt,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
          },
        });

        createdInvoice = this.toInvoiceEntity(persistedInvoice);

        if (installments.length > 0) {
          await tx.invoiceInstallment.createMany({
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
        }
      }

      return {
        user: this.toUserEntity(createdUser),
        tenant: this.toTenantEntity(createdTenant),
        owner: this.toTenantMemberEntity(createdOwner),
        subscription: this.toSubscriptionEntity(createdSubscription),
        invoice: createdInvoice,
        installments,
      };
    });
  }

  private toUserEntity(data: {
    id: string;
    name: string;
    email: string;
    password: string;
    role: PrismaUserRole;
    isActive: boolean;
    emailVerified: boolean;
    verificationToken: string | null;
    verificationTokenExpiresAt: Date | null;
    refreshTokenHash: string | null;
    passwordResetToken: string | null;
    passwordResetExpiresAt: Date | null;
    lastLoginAt: Date | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    return new UserEntity({
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role as UserRole,
      isActive: data.isActive,
      emailVerified: data.emailVerified,
      verificationToken: data.verificationToken,
      verificationTokenExpiresAt: data.verificationTokenExpiresAt,
      refreshTokenHash: data.refreshTokenHash,
      passwordResetToken: data.passwordResetToken,
      passwordResetExpiresAt: data.passwordResetExpiresAt,
      lastLoginAt: data.lastLoginAt,
      deletedAt: data.deletedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private toTenantEntity(data: {
    id: string;
    name: string;
    slug: string;
    status: PrismaTenantStatus;
    createdAt: Date;
    updatedAt: Date;
  }): TenantEntity {
    return new TenantEntity(
      data.id,
      data.name,
      data.slug,
      data.status as TenantStatus,
      data.createdAt,
      data.updatedAt,
    );
  }

  private toTenantMemberEntity(data: {
    id: string;
    tenantId: string;
    userId: string;
    role: PrismaTenantRole;
    status: PrismaTenantMemberStatus;
    createdAt: Date;
    updatedAt: Date;
  }): TenantMemberEntity {
    return new TenantMemberEntity({
      id: data.id,
      tenantId: data.tenantId,
      userId: data.userId,
      role: data.role as TenantRole,
      status: data.status as TenantMemberStatus,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  private toSubscriptionEntity(data: {
    id: string;
    tenantId: string;
    planId: string;
    planPriceId: string | null;
    pendingPlanId: string | null;
    pendingPlanPriceId: string | null;
    pendingPlanChangeType: string | null;
    pendingPlanEffectiveAt: Date | null;
    pendingPlanInvoiceId: string | null;
    status: PrismaSubscriptionStatus;
    startedAt: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    billingDay: number | null;
    nextBillingDate: Date | null;
    trialEndsAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SubscriptionEntity {
    return new SubscriptionEntity(
      data.id,
      data.tenantId,
      data.planId,
      data.planPriceId,
      data.status as SubscriptionStatus,
      data.startedAt,
      data.currentPeriodStart,
      data.currentPeriodEnd,
      data.billingDay,
      data.nextBillingDate,
      data.trialEndsAt,
      data.cancelledAt,
      data.createdAt,
      data.updatedAt,
      data.pendingPlanId,
      data.pendingPlanPriceId,
      data.pendingPlanChangeType as SubscriptionEntity['pendingPlanChangeType'],
      data.pendingPlanEffectiveAt,
      data.pendingPlanInvoiceId,
    );
  }

  private toInvoiceEntity(data: {
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
      data.id,
      data.tenantId,
      data.subscriptionId,
      data.number,
      data.status as InvoiceStatus,
      data.amount.toNumber(),
      data.currency,
      data.dueAt,
      data.paidAt,
      data.createdAt,
      data.updatedAt,
      data.installmentCount,
    );
  }
}
