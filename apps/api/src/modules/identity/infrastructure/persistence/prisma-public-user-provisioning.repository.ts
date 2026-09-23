import { Injectable } from '@nestjs/common';
import {
  SubscriptionStatus as PrismaSubscriptionStatus,
  TenantMemberStatus as PrismaTenantMemberStatus,
  TenantRole as PrismaTenantRole,
  TenantStatus as PrismaTenantStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { UserEntity, UserRole } from '../../domain/entities/user.entity';
import {
  PublicTrialPlanData,
  PublicUserProvisioningRepository,
} from '../../domain/repositories/public-user-provisioning.repository';

import { TenantMemberEntity } from '../../../tenant/domain/entities/tenant-member.entity';
import { TenantEntity } from '../../../tenant/domain/entities/tenant.entity';
import { TenantMemberStatus } from '../../../tenant/domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../tenant/domain/enums/tenant-role.enum';
import { TenantStatus } from '../../../tenant/domain/enums/tenant-status.enum';

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
 * 4. Subscription TRIALING vinculada ao plano TRIAL.
 *
 * Se qualquer operação falhar, todas as operações são revertidas.
 */
@Injectable()
export class PrismaPublicUserProvisioningRepository implements PublicUserProvisioningRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca o plano TRIAL atualmente disponível para cadastro público.
   */
  async findPublicTrialPlan(): Promise<PublicTrialPlanData | null> {
    const trialPlan = await this.prisma.plan.findUnique({
      where: {
        code: 'TRIAL',
      },
      select: {
        id: true,
        billingInterval: true,
        isPublic: true,
        isActive: true,
      },
    });

    if (!trialPlan || !trialPlan.isPublic || !trialPlan.isActive) {
      return null;
    }

    return {
      id: trialPlan.id,
      billingInterval: trialPlan.billingInterval as unknown as BillingInterval,
    };
  }

  async create(
    user: UserEntity,
    tenant: TenantEntity,
    owner: TenantMemberEntity,
    subscription: SubscriptionEntity,
  ): Promise<{
    user: UserEntity;
    tenant: TenantEntity;
    owner: TenantMemberEntity;
    subscription: SubscriptionEntity;
  }> {
    return this.prisma.$transaction(async (tx) => {
      /**
       * O plano é consultado novamente dentro da transação para que
       * a criação efetiva nunca dependa apenas da validação anterior.
       */
      const trialPlan = await tx.plan.findUnique({
        where: {
          code: 'TRIAL',
        },
      });

      if (!trialPlan) {
        throw new Error('Plano TRIAL não encontrado.');
      }

      if (!trialPlan.isPublic || !trialPlan.isActive) {
        throw new Error(
          'Plano TRIAL não está disponível para cadastro público.',
        );
      }

      if (subscription.planId !== trialPlan.id) {
        throw new Error(
          'A assinatura de cadastro público não está vinculada ao plano TRIAL.',
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

      const createdTenant = await tx.tenant.create({
        data: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
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

      const createdSubscription = await tx.subscription.create({
        data: {
          id: subscription.id,
          tenantId: subscription.tenantId,
          planId: trialPlan.id,
          status: subscription.status,
          startedAt: subscription.startedAt,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          trialEndsAt: subscription.trialEndsAt,
          cancelledAt: subscription.cancelledAt,
        },
      });

      return {
        user: this.toUserEntity(createdUser),
        tenant: this.toTenantEntity(createdTenant),
        owner: this.toTenantMemberEntity(createdOwner),
        subscription: this.toSubscriptionEntity(createdSubscription),
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
    status: PrismaSubscriptionStatus;
    startedAt: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEndsAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SubscriptionEntity {
    return new SubscriptionEntity(
      data.id,
      data.tenantId,
      data.planId,
      data.status as SubscriptionStatus,
      data.startedAt,
      data.currentPeriodStart,
      data.currentPeriodEnd,
      data.trialEndsAt,
      data.cancelledAt,
      data.createdAt,
      data.updatedAt,
    );
  }
}
